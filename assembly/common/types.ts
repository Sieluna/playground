/*
 * IoT Curtain Control System - Shared Type Definitions
 */

export class SensorData {
  sensorType: string;
  value: number;
  timestamp: number;

  constructor(sensorType: string, value: number) {
    this.sensorType = sensorType;
    this.value = value;
    this.timestamp = Date.now();
  }
}

export class CurtainCommand {
  action: string;    // "OPEN" or "CLOSE"
  target: string;    // Curtain identifier

  constructor(action: string, target: string = "curtain1") {
    this.action = action;
    this.target = target;
  }
}

export class EdgeStatus {
  lightLevel: number;
  curtainState: string;
  ruleActive: boolean;
  timestamp: number;

  constructor(lightLevel: number, curtainState: string, ruleActive: boolean) {
    this.lightLevel = lightLevel;
    this.curtainState = curtainState;
    this.ruleActive = ruleActive;
    this.timestamp = Date.now();
  }
}

export class CurtainRule {
  ruleId: string;
  startTime: string;   // e.g., "07:00"
  endTime: string;     // e.g., "09:00"
  enabled: boolean;

  constructor(ruleId: string, startTime: string, endTime: string, enabled: boolean = true) {
    this.ruleId = ruleId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.enabled = enabled;
  }
}

export class ScheduleUpdate {
  rule: CurtainRule;
  timestamp: number;

  constructor(rule: CurtainRule) {
    this.rule = rule;
    this.timestamp = Date.now();
  }
} 