#include "backend_link.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <WebSocketsClient.h>
#include <WiFi.h>

#include "config.h"
#include "secrets.h"

static WebSocketsClient ws;

static void connectWifi() {
  Serial.printf("connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(WIFI_RETRY_MS);
    Serial.print(".");
  }
  // Modem sleep can hold packets back for a moment, which skews reaction times.
  WiFi.setSleep(false);
  Serial.printf("\nwifi ok, board IP %s\n", WiFi.localIP().toString().c_str());
}

static void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_CONNECTED) Serial.println("websocket connected");
  if (type == WStype_DISCONNECTED) Serial.println("websocket disconnected, retrying");
}

void startLink() {
  connectWifi();
  String path = String("/ws/device?token=") + DEVICE_TOKEN;
  ws.begin(BACKEND_HOST, BACKEND_PORT, path);
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(RECONNECT_INTERVAL_MS);
}

void serviceLink() { ws.loop(); }

void sendPadEvent(const char* type, int pad, const char* hand) {
  JsonDocument doc;
  doc["type"] = type;
  doc["pad"] = pad;
  doc["hand"] = hand;
  doc["ms"] = millis();
  String msg;
  serializeJson(doc, msg);

  if (!ws.isConnected()) {
    Serial.println("not connected, dropped " + msg);
    return;
  }
  ws.sendTXT(msg);
  Serial.println("sent " + msg);
}
