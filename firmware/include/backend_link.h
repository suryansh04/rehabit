#pragma once

// Joins Wi-Fi (blocks until connected), then opens the WebSocket to the backend.
void startLink();
// Call every loop. Keeps the WebSocket alive and reconnects it.
void serviceLink();
void sendPadEvent(const char* type, int pad, const char* hand);
