/*
 * IoT Curtain Control System - Sensor Module
 */

import * as console from "../wamr_app_lib/console";
import * as timer from "../wamr_app_lib/timer";
import * as request from "../wamr_app_lib/request";
import { SensorData } from "../common/types";

// Constants
const SENSOR_TYPE = "light";
const INTERVAL_MS = 3000;  // Send data every 3 seconds
const MIN_LIGHT_VALUE = 100;
const MAX_LIGHT_VALUE = 1000;

// Current light value (for simulation)
let currentLightValue = 500;
let valueChangeDirection = 1; // 1 means increasing, -1 means decreasing

// Convert string to ArrayBuffer (simplified version)
function stringToArrayBuffer(str: string): ArrayBuffer {
  const buffer = new ArrayBuffer(str.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buffer;
}

// Simulate light intensity reading (changes over time to simulate day-night cycle)
function readLightIntensity(): number {
  // Simulate light value change over time
  currentLightValue += valueChangeDirection * Math.floor(Math.random() * 50);
  
  // Change direction when reaching boundaries
  if (currentLightValue >= MAX_LIGHT_VALUE) {
    currentLightValue = MAX_LIGHT_VALUE;
    valueChangeDirection = -1;
  } else if (currentLightValue <= MIN_LIGHT_VALUE) {
    currentLightValue = MIN_LIGHT_VALUE;
    valueChangeDirection = 1;
  }
  
  return currentLightValue;
}

// Timer callback: read sensor and publish event
function onSensorTimer(): void {
  const value = readLightIntensity();
  const data = new SensorData(SENSOR_TYPE, value);
  
  // Serialize object to JSON string
  const jsonStr = JSON.stringify(data);
  
  // Create ArrayBuffer to store JSON string
  const payload = stringToArrayBuffer(jsonStr);
  
  // Publish sensor data event
  request.publish_event("sensor/data", 0, payload, payload.byteLength);
  
  // Log output
  console.log(`Sensor: Published light data ${jsonStr}`);
}

// Initialization function
export function on_init(): void {
  // Create timer to periodically publish sensor data
  timer.setInterval(onSensorTimer, INTERVAL_MS);
  console.log(`Sensor module initialized, publishing ${SENSOR_TYPE} data every ${INTERVAL_MS} milliseconds`);
}

// Destroy function
export function on_destroy(): void {
  console.log("Sensor module destroyed");
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