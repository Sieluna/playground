/*
 * IoT Curtain Control System - Edge Processing Module
 */

import * as console from "../wamr_app_lib/console";
import * as timer from "../wamr_app_lib/timer";
import * as request from "../wamr_app_lib/request";
import { SensorData, CurtainCommand, EdgeStatus, CurtainRule, ScheduleUpdate } from "../common/types";

// Constants
const LIGHT_THRESHOLD = 500; // Light threshold, open curtain above this value, close below

// Current state
let currentRule: CurtainRule | null = null;
let currentCurtainState = "closed"; // Initial state: closed

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const buffer = new ArrayBuffer(str.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buffer;
}

// Parse string from ArrayBuffer
function arrayBufferToString(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < view.length; i++) {
    str += String.fromCharCode(view[i]);
  }
  return str;
}

// Check if current time is within the disabled period for curtain operation
function isWithinDisabledPeriod(): boolean {
  if (currentRule && currentRule.enabled) {
    // Get current time (simplified, only focus on hours and minutes)
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Format as HH:MM
    const currentTime = 
      (hours < 10 ? "0" + hours : hours.toString()) + ":" + 
      (minutes < 10 ? "0" + minutes : minutes.toString());
    
    // Simple string comparison (assumes consistent format)
    return currentTime >= currentRule.startTime && currentTime < currentRule.endTime;
  }
  return false;
}

// Callback function for processing sensor data
function onSensorData(req: any): void {
  // Get JSON data from request
  const payloadStr = arrayBufferToString(req.payload);
  let data: SensorData;
  
  try {
    data = JSON.parse(payloadStr) as SensorData;
  } catch (e) {
    console.log("Edge: Failed to parse sensor data");
    return;
  }
  
  console.log(`Edge: Received sensor data => Type=${data.sensorType}, Value=${data.value}`);
  
  // Check if within disabled period
  const ruleActive = isWithinDisabledPeriod();
  if (ruleActive) {
    console.log("Edge: Currently within disabled period, ignoring sensor input");
    
    // Report current status (curtain unchanged)
    const status = new EdgeStatus(data.value, currentCurtainState, true);
    const statusStr = JSON.stringify(status);
    const statusBuffer = stringToArrayBuffer(statusStr);
    request.publish_event("edge/status", 0, statusBuffer, statusBuffer.byteLength);
    
    return;
  }
  
  // Decision logic: control curtain based on light intensity
  let command: CurtainCommand | null = null;
  
  if (data.value >= LIGHT_THRESHOLD) {
    // High light intensity -> Open curtain
    if (currentCurtainState !== "open") {
      command = new CurtainCommand("OPEN");
      currentCurtainState = "open";
    }
  } else {
    // Low light intensity -> Close curtain
    if (currentCurtainState !== "closed") {
      command = new CurtainCommand("CLOSE");
      currentCurtainState = "closed";
    }
  }
  
  // If curtain state needs to change, send command
  if (command) {
    // Serialize command and publish event
    const cmdStr = JSON.stringify(command);
    const cmdBuffer = stringToArrayBuffer(cmdStr);
    
    request.publish_event("curtain/cmd", 0, cmdBuffer, cmdBuffer.byteLength);
    console.log(`Edge: Sent curtain command => ${command.action}`);
  }
  
  // Report current status
  const status = new EdgeStatus(data.value, currentCurtainState, false);
  const statusStr = JSON.stringify(status);
  const statusBuffer = stringToArrayBuffer(statusStr);
  request.publish_event("edge/status", 0, statusBuffer, statusBuffer.byteLength);
}

// Callback function for processing rule updates
function onScheduleUpdate(req: any): void {
  // Get JSON data from request
  const payloadStr = arrayBufferToString(req.payload);
  let update: ScheduleUpdate;
  
  try {
    update = JSON.parse(payloadStr) as ScheduleUpdate;
  } catch (e) {
    console.log("Edge: Failed to parse rule update data");
    return;
  }
  
  // Update rule
  currentRule = update.rule;
  
  console.log(`Edge: Received rule update => Rule ID=${currentRule.ruleId}, ` +
    `Disabled period=${currentRule.startTime}-${currentRule.endTime}, ` +
    `Enabled status=${currentRule.enabled}`);
}

// Initialization function
export function on_init(): void {
  // Subscribe to sensor data events
  request.subscribe_event("sensor/data", onSensorData);
  
  // Subscribe to rule update events
  request.subscribe_event("cloud/ruleUpdate", onScheduleUpdate);
  
  console.log("Edge processing module initialized, subscribed to sensor data and cloud rule updates");
}

// Destroy function
export function on_destroy(): void {
  console.log("Edge processing module destroyed");
}

/* Export functions for WAMR runtime callbacks */
export function _on_timer_callback(on_timer_id: number): void {
  timer.on_timer_callback(on_timer_id);
}

export function _on_request(buffer_offset: number, size: number): void {
  request.on_request(buffer_offset, size);
}

export function _on_response(buffer_offset: number, size: number): void {
  request.on_response(buffer_offset, size);
} 