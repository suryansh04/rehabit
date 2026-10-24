#pragma once

// type is "tap" or "hold", pad is 1 to 6.
typedef void (*PadEventHandler)(const char* type, int pad);

void calibratePads();
void pollPads(PadEventHandler onEvent);
