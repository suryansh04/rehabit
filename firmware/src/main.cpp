#include <Arduino.h>

#include "backend_link.h"
#include "config.h"
#include "pads.h"

const char* readHand() { return digitalRead(HAND_SWITCH_PIN) == LOW ? "left" : "right"; }

void onPadEvent(const char* type, int pad) { sendPadEvent(type, pad, readHand()); }

void setup() {
  Serial.begin(SERIAL_BAUD);
  pinMode(HAND_SWITCH_PIN, INPUT_PULLUP);
  // Calibrate after Wi-Fi is up, since the radio shifts the touch readings a little.
  startLink();
  calibratePads();
}

void loop() {
  serviceLink();
  pollPads(onPadEvent);
}
