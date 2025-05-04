/*
 * IoT Curtain Control System - Cloud Management Module
 * 
 * This is a simulated cloud module using Node.js, communicating with the edge device via TCP.
 * In actual deployment, more sophisticated communication mechanisms like MQTT or HTTP APIs might be used.
 */

const net = require('net');
const fs = require('fs');

// Simulated configuration
const EDGE_HOST = '127.0.0.1';
const EDGE_PORT = 8888;  // Assume edge device listens on this port

// Curtain scheduling rule
const curtainRule = {
  ruleId: "morning_rule",
  startTime: "07:00",
  endTime: "09:00",
  enabled: true
};

// Store received status information
let lastStatus = null;

// Create TCP client to connect to edge device
let client = null;

// Connect to edge device
function connectToEdge() {
  console.log(`Cloud: Attempting to connect to edge device (${EDGE_HOST}:${EDGE_PORT})...`);
  
  client = new net.Socket();
  
  client.connect(EDGE_PORT, EDGE_HOST, () => {
    console.log('Cloud: Connected to edge device');
    
    // Send rule update after successful connection
    sendRuleUpdate();
  });
  
  // Handle received data
  client.on('data', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Check message type
      if (message.type === 'edge/status') {
        handleEdgeStatus(message.payload);
      } else {
        console.log(`Cloud: Received unknown message type: ${message.type}`);
      }
    } catch (err) {
      console.error('Cloud: Failed to parse message:', err.message);
    }
  });
  
  // Handle connection close
  client.on('close', () => {
    console.log('Cloud: Connection closed, attempting to reconnect in 5 seconds...');
    setTimeout(connectToEdge, 5000);
  });
  
  // Handle errors
  client.on('error', (err) => {
    console.error(`Cloud: Connection error: ${err.message}`);
    client.destroy();
  });
}

// Send rule update to edge device
function sendRuleUpdate() {
  const scheduleUpdate = {
    rule: curtainRule,
    timestamp: Date.now()
  };
  
  const message = {
    type: 'cloud/ruleUpdate',
    payload: scheduleUpdate
  };
  
  if (client && client.writable) {
    client.write(JSON.stringify(message));
    console.log(`Cloud: Sent rule update => ID: ${curtainRule.ruleId}, Period: ${curtainRule.startTime}-${curtainRule.endTime}`);
  } else {
    console.error('Cloud: Cannot send rule update, connection unavailable');
  }
}

// Handle received edge status
function handleEdgeStatus(status) {
  lastStatus = status;
  console.log(`Cloud: Received edge status => Light: ${status.lightLevel}, Curtain: ${status.curtainState}, Rule active: ${status.ruleActive}`);
  
  // Here you can add status storage, analysis, trigger alerts, etc.
  // For example, save status to a file
  fs.appendFileSync('edge_status_log.txt', 
    `${new Date().toISOString()} - Light: ${status.lightLevel}, Curtain: ${status.curtainState}, Rule active: ${status.ruleActive}\n`);
}

// Provide a simple command line interface to change rules
function setupCommandInterface() {
  const readline = require('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\nCloud management commands:');
  console.log('1. Enable/disable rule (enable/disable)');
  console.log('2. Change rule period (time start_time end_time, e.g.: time 07:00 09:00)');
  console.log('3. Check latest status (status)');
  console.log('4. Exit (exit)');
  
  rl.on('line', (input) => {
    const args = input.trim().split(' ');
    const command = args[0].toLowerCase();
    
    if (command === 'enable') {
      curtainRule.enabled = true;
      console.log('Cloud: Rule enabled');
      sendRuleUpdate();
    } 
    else if (command === 'disable') {
      curtainRule.enabled = false;
      console.log('Cloud: Rule disabled');
      sendRuleUpdate();
    }
    else if (command === 'time' && args.length === 3) {
      curtainRule.startTime = args[1];
      curtainRule.endTime = args[2];
      console.log(`Cloud: Rule period updated to ${args[1]}-${args[2]}`);
      sendRuleUpdate();
    }
    else if (command === 'status') {
      if (lastStatus) {
        console.log(`Cloud: Latest status => Light: ${lastStatus.lightLevel}, Curtain: ${lastStatus.curtainState}, Rule active: ${lastStatus.ruleActive}`);
      } else {
        console.log('Cloud: No status information received yet');
      }
    }
    else if (command === 'exit') {
      console.log('Cloud: Exiting...');
      if (client) client.destroy();
      process.exit(0);
    }
    else {
      console.log('Cloud: Unknown command, please use: enable, disable, time, status, exit');
    }
  });
}

// Start cloud module
function start() {
  console.log('===== IoT Curtain Control System - Cloud Management Module =====');
  console.log(`Current rule: ${curtainRule.ruleId} (${curtainRule.startTime}-${curtainRule.endTime}), Enabled: ${curtainRule.enabled}`);
  
  connectToEdge();
  setupCommandInterface();
}

// Start program
start(); 