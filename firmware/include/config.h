#pragma once

// Pad N is PAD_PINS[N - 1]. See the pad map in CLAUDE.md.
const int PAD_PINS[] = {4, 13, 14, 27, 32, 33};
const int PAD_COUNT = sizeof(PAD_PINS) / sizeof(PAD_PINS[0]);
const int PALM_PAD = 6;

// LOW is left hand, HIGH is right hand.
const int HAND_SWITCH_PIN = 25;

const int CALIBRATION_READS = 20;
const int CALIBRATION_GAP_MS = 5;
// A pad counts as touched when its reading drops below this share of its baseline.
const float TOUCH_FACTOR = 0.7;
const unsigned long DEBOUNCE_MS = 150;
const unsigned long HOLD_MS = 2000;

const unsigned long SERIAL_BAUD = 115200;
const int WIFI_RETRY_MS = 500;
const int RECONNECT_INTERVAL_MS = 2000;
