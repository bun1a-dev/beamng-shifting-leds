#!/usr/bin/node

// BeamNG → Logitech G923 RPM LEDs

const hid = require('node-hid');
const dgram = require('dgram');
const { exit } = require('process');

const socket = dgram.createSocket('udp4');
const PORT = 5555;
const ADDRESS = "127.0.0.1";

// ====== STATE ======
let rpm = 0;
let maxrpm = 7000;
let g923;

let firstTime = true;
let previousLEDMask = -1;
let LEDsOn = false;
let LEDFlashTime = 0;

// ====== INPUT ======
process.stdin.on('data', data => {
  const val = Number(data.toString());
  if (!isNaN(val) && val > 0) {
    maxrpm = val;
    console.log("Max RPM set to:", maxrpm);
  }
});

console.log("Type Max RPM and press ENTER (default 7000)");

// ====== UDP ======
socket.bind(PORT, ADDRESS);

// ====== HID ======
try {
  g923 = new hid.HID(0x046d, 0xc266);
  console.log("Connected to Logitech G923");
} catch (e) {
  console.log("Could not open Logitech G923 (permissions?)");
  console.log(e);
  exit(1);
}

// ====== DATA ======
socket.on("message", (msg) => {
  if (firstTime) {
    console.log("Connected to BeamNG.Drive");
    firstTime = false;
  }

  // RPM from BeamNG (little-endian float)
  rpm = msg.readFloatLE(16);
  rpm = Math.max(0, Math.min(rpm, maxrpm));

  updateLeds();
});

// ====== LED LOGIC ======
function updateLeds() {
  const rpmFrac = rpm / maxrpm;
  const now = Date.now();

  // Limiter flash
  if (rpmFrac > 0.93) {
    if (now - LEDFlashTime > 100) {
      flashLEDs();
    }
    return;
  }

  let LEDMask = 0x0;

  if (rpmFrac > 0.45)  LEDMask |= 0x01;
  if (rpmFrac > 0.55)  LEDMask |= 0x02;
  if (rpmFrac > 0.625) LEDMask |= 0x04;
  if (rpmFrac > 0.71)  LEDMask |= 0x08;
  if (rpmFrac > 0.85)  LEDMask |= 0x10;

  if (LEDMask === previousLEDMask) return;

  previousLEDMask = LEDMask;
  g923.write([0xf8, 0x12, LEDMask & 0x1F, 0x00, 0x00, 0x00, 0x01]);
}

// ====== FLASH ======
function flashLEDs() {
  if (LEDsOn) {
    g923.write([0xf8, 0x12, 0x1F, 0x00, 0x00, 0x00, 0x01]);
  } else {
    g923.write([0xf8, 0x12, 0x00, 0x00, 0x00, 0x00, 0x01]);
  }

  LEDsOn = !LEDsOn;
  LEDFlashTime = Date.now();
}
