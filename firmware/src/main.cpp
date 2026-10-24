#include <Arduino.h>

// Test 1 from WORK.md. Dhruv replaces this with the real firmware.
void setup() { Serial.begin(115200); }

void loop() {
  Serial.println("Rehabit ESP32 alive");
  delay(1000);
}
