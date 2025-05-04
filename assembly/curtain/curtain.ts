/*
 * IoT Curtain Control System - Curtain Control Module
 */

import * as console from "../wamr_app_lib/console";
import * as timer from "../wamr_app_lib/timer";
import * as request from "../wamr_app_lib/request";
import { CurtainCommand } from "../common/types";

// Current curtain state
let currentState = "closed"; // Initial state: closed

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

// Execute curtain operation
function executeCurtainAction(action: string): void {
  // In a real device, this would control hardware to perform open/close operations
  // In simulation, we only log the action
  if (action === "OPEN") {
    console.log("Curtain: Opening curtain...");
    currentState = "open";
    
    // Simulate operation delay
    timer.setTimeout(() => {
      console.log("Curtain: Curtain fully opened");
    }, 1000);
  } else if (action === "CLOSE") {
    console.log("Curtain: Closing curtain...");
    currentState = "closed";
    
    // Simulate operation delay
    timer.setTimeout(() => {
      console.log("Curtain: Curtain fully closed");
    }, 1000);
  } else {
    console.log(`Curtain: Unknown action "${action}"`);
  }
}

// Callback function for processing curtain commands
function onCurtainCommand(req: any): void {
  // Get JSON data from request
  const payloadStr = arrayBufferToString(req.payload);
  let command: CurtainCommand;
  
  try {
    command = JSON.parse(payloadStr) as CurtainCommand;
  } catch (e) {
    console.log("Curtain: Failed to parse command data");
    return;
  }
  
  console.log(`Curtain: Received command => Action=${command.action}, Target=${command.target}`);
  
  // Execute curtain action
  executeCurtainAction(command.action);
}

// Initialization function
export function on_init(): void {
  // Subscribe to curtain command events
  request.subscribe_event("curtain/cmd", onCurtainCommand);
  
  console.log("Curtain control module initialized, waiting for commands");
}

// Destroy function
export function on_destroy(): void {
  console.log("Curtain control module destroyed");
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