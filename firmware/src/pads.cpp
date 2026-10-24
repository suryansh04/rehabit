#include "pads.h"

#include <Arduino.h>

#include "config.h"

struct PadState {
  int baseline;
  bool touched;
  unsigned long changedAt;
  bool holdSent;
};

static PadState pads[PAD_COUNT];

static int averageReading(int pin) {
  long sum = 0;
  for (int k = 0; k < CALIBRATION_READS; k++) {
    sum += touchRead(pin);
    delay(CALIBRATION_GAP_MS);
  }
  return sum / CALIBRATION_READS;
}

void calibratePads() {
  for (int i = 0; i < PAD_COUNT; i++) {
    pads[i] = {averageReading(PAD_PINS[i]), false, 0, false};
    Serial.printf("pad %d (GPIO %d) baseline %d\n", i + 1, PAD_PINS[i], pads[i].baseline);
  }
}

static bool readsTouched(int i) {
  return touchRead(PAD_PINS[i]) < pads[i].baseline * TOUCH_FACTOR;
}

void pollPads(PadEventHandler onEvent) {
  unsigned long now = millis();
  for (int i = 0; i < PAD_COUNT; i++) {
    PadState& pad = pads[i];
    int padNumber = i + 1;

    // Take a change at once, then ignore flicker for DEBOUNCE_MS. Waiting
    // for the reading to settle would add delay to every reaction time.
    bool touched = readsTouched(i);
    if (touched != pad.touched && now - pad.changedAt >= DEBOUNCE_MS) {
      pad.touched = touched;
      pad.changedAt = now;
      pad.holdSent = false;
      if (touched) onEvent("tap", padNumber);
    }

    if (padNumber == PALM_PAD && pad.touched && !pad.holdSent && now - pad.changedAt >= HOLD_MS) {
      pad.holdSent = true;
      onEvent("hold", padNumber);
    }
  }
}
