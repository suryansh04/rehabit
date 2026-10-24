# Rehabit: Work Plan

Read CLAUDE.md first. It has the pin map and the tech stack.

## Team

| Person   | Work                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Suryansh | Frontend and backend. Games, dashboard, voice coach, AI companion, reminder call.     |
| Dhruv    | All hardware. Wiring, firmware, WebSocket link.                                       |
| Person 3 | All slides and the demo script. Suryansh gives a separate project README for context. |
| Person 4 | WhatsApp demo. We choose OmniDimension or Meta Cloud API later.                       |

## How the work connects

- Dhruv sends taps to the backend WebSocket. See "Message formats".
- The backend sends 3 events to Person 4: daily summary, missed session, low mood.
- WhatsApp provider is not final. The backend uses one `send_whatsapp(event, data)` function. Only that function changes when we choose.
- Person 3 needs a working demo from Suryansh to write the script.
- Everyone keeps their own API keys in `.env`. Do not commit `.env`.

## Priority

1. Must have: board, Classic game, dashboard.
2. Should have: 3 more game modes, voice coach.
3. Nice to have: AI companion, WhatsApp, reminder call.

If time is short, cut from the bottom.

---

## Suryansh: build order

1. **Backend skeleton.** FastAPI app. WebSocket routes `/ws/device` and `/ws/game`. SQLite database. Check `DEVICE_TOKEN` on the device route. The ESP32 sends it as a query: `/ws/device?token=...`.
2. **Fake device script.** A Python script that sends fake taps. Type a pad number (1 to 6) and press Enter, or type `auto` for random taps. Use it to work without hardware. It is a dev tool, not a test file.
3. **Frontend skeleton.** React, TypeScript, Tailwind, Vite. A WebSocket hook. A hand picture with 6 pads that light up on each tap.
4. **Classic game.** A pad glows. The patient taps it. Record reaction time and accuracy.
5. **Save sessions.** `POST /api/session`. Then a basic dashboard that lists sessions.
6. **Other game modes.** Finger isolation, Memory sequence, Endurance.
7. **Left and right hand mode.** Read the `hand` field in each message.
8. **Voice coach.** Make the 5 audio clips on the ElevenLabs website before the demo (a cute, cheerful voice; Sarvam voices sounded too mature). Save them as `frontend/public/clips/<id>.mp3`. Play a clip on events, such as streaks and the last 5 taps.
9. **AI companion (Rehabit AI).** An ElevenLabs agent with `@elevenlabs/react` in the browser (voice "Viraj", Hindi, 180 second max). The patient clicks "Start session" once first (browsers need a click for audio and microphone). Then a 2 second palm hold starts the talk. Never put the ElevenLabs key in the browser. The backend gives the browser a short-lived token. Save the mood score with `POST /api/mood`.
10. **Reminder call.** A timer in the backend. At `REMINDER_MINUTES_BEFORE` minutes before `SESSION_TIME`, call `PATIENT_PHONE` with the Sarvam Instant Outbound API. The call says a game session is coming up. Send `patient_name` and `session_time` in `agent_variables` (declare both on the agent's Variables tab). Add a "Call now" button on the dashboard for the demo. This needs a phone number and a connection in the Sarvam workspace. Set this up early. If it fails, play a recorded call in the demo.
11. **WhatsApp events.** Write `send_whatsapp(event, data)`. It sends the 3 events through the chosen provider (OmniDimension or Meta Cloud API). Start with a stub that prints the message.
12. **Dashboard charts.** Progress per mode. Mood vs reaction time.
13. **Demo data.** Fill the database with 7 days of fake sessions for the dashboard.
14. **Ankur mascot.** One SVG component with CSS animation states, and a cloud thought bubble for the coach lines. He stays calm while a coin glows, so reaction times stay fair. All motion stops with reduced motion.

### API endpoints

| Endpoint             | Use                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `WS /ws/device`      | Taps from the ESP32                                                                          |
| `WS /ws/game`        | Taps to the frontend                                                                         |
| `POST /api/session`  | Save a game session                                                                          |
| `POST /api/mood`     | Save a mood score                                                                            |
| `GET /api/sessions`  | List sessions for the dashboard, newest first. Each session has its `mood` (or null)        |
| `POST /api/call-now` | Start the reminder call now (demo button)                                                    |
| `GET /api/config`    | Public settings for the frontend: patient name, session time, reminder minutes, missed-after minutes, daily summary time. No keys |
| `GET /api/companion/token` | Short-lived ElevenLabs conversation token for Rehabit AI. The backend adds `xi-api-key` |

### Database

- `sessions`: id, mode, hand, started_at, duration_s, taps, correct, avg_reaction_ms, accuracy, score.
  - `score` is the main number for the mode: accuracy % (Classic, Finger isolation), longest sequence in pads (Memory), correct taps (Endurance).
- `moods`: id, session_id, score (1 to 5), created_at. The patient taps pad 1 to 5 after the companion talk. The backend links the mood to the latest session (null if there is none).

### Frontend notes

- The Vite dev server proxies `/api` and `/ws` to the backend on port 8000. The browser only talks to port 5173, so one ngrok tunnel to 5173 covers the page, the API and the socket.
- Charts are small SVG components (sparkline, bars, scatter). No chart library.
- Font: Plus Jakarta Sans (`@fontsource`). Icons: `lucide-react`. Design (local only, not in git): `design/NOTES.md` and `design/round-04-play/`.
- Keys 1 to 6 on the keyboard act as pads, and holding 6 for 2 seconds acts as a palm hold. This works without the board.

### Events for Person 4

| Event            | When                                                                               |
| ---------------- | ---------------------------------------------------------------------------------- |
| `daily_summary`  | Once each day. Taps, reaction time trend, streak.                                  |
| `missed_session` | No session saved within `MISSED_AFTER_MINUTES` after `SESSION_TIME`. Once per day. |
| `low_mood`       | Mood score is 2 or lower.                                                          |

---

## Dhruv: hardware

1. Install the CP210x driver. The board is on COM13 on Suryansh's laptop. Your port can be different.
2. Run the hello test. "Rehabit ESP32 alive" must print every second.
3. Tape 6 coins on cardboard. Wire them to GPIO 4, 13, 14, 27, 32, 33. See CLAUDE.md.
4. Wire the slide switch to GPIO25 and GND.
5. Run the touch test. Each coin must print the right pad number.
6. Write the firmware. Calibrate at boot. Debounce taps by 150 ms. Read the hand switch.
7. Connect to the phone hotspot. Open a WebSocket to the backend. Reconnect if the link drops.
8. Send the messages in "Message formats".
9. Test with a fake WebSocket server until the backend is ready.
10. Draw the hand outline on the cardboard. Put coins on the fingertips and the palm.

### Install and test guide for Dhruv

Do the tests in order. Do not go to the next test until the current test passes.

**A. Install**

1. Install VS Code. Install the PlatformIO IDE extension. Or run `pip install platformio`.
2. Install the CP210x driver from Silicon Labs (the board has a CP2102N chip). Restart the laptop.
3. Use a USB cable that carries data. Many cables only charge.
4. Connect the board. Run `pio device list`. A port such as `COM13` must show with `VID:PID=10C4:EA60`. If it does not show, change the cable or the USB port.

**B. Make the project**

```
mkdir rehabit && cd rehabit && mkdir firmware && cd firmware
pio project init --board esp32dev --project-option "framework=arduino"
```

Open `platformio.ini`. Make it look like this. Change the port to yours:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_port = COM13
monitor_port = COM13
lib_deps =
    links2004/WebSockets
    bblanchon/ArduinoJson
```

Put test code in `src/main.cpp`. Upload with `pio run -t upload`. Open the serial monitor with `pio device monitor`. If upload stops at "Connecting...", hold the BOOT button until it starts.

**C. Test 1: board is alive**

```cpp
#include <Arduino.h>
void setup() { Serial.begin(115200); }
void loop() { Serial.println("Rehabit ESP32 alive"); delay(1000); }
```

Pass: the text prints every second.

**D. Test 2: the 6 pads**

Tape the coins first. Solder or clip a jumper wire from each coin to its GPIO. Do not touch the pads during boot.

```cpp
#include <Arduino.h>
const int pads[] = {4, 13, 14, 27, 32, 33};
const int N = 6;
int baseline[N];
void setup() {
  Serial.begin(115200);
  delay(1000);
  for (int i = 0; i < N; i++) {
    long sum = 0;
    for (int k = 0; k < 20; k++) { sum += touchRead(pads[i]); delay(5); }
    baseline[i] = sum / 20;
    Serial.printf("pad %d baseline %d\n", i + 1, baseline[i]);
  }
}
void loop() {
  for (int i = 0; i < N; i++) {
    int v = touchRead(pads[i]);
    if (v < baseline[i] * 0.7) {
      Serial.printf("PAD %d TOUCHED (%d)\n", i + 1, v);
      delay(150);
    }
  }
}
```

Pass: touch each coin one time. The right pad number prints. No pad prints when you do not touch. If a pad does not react, make the factor 0.7 bigger (for example 0.85). If a pad prints alone, check the wire.

**E. Test 3: hand switch**

```cpp
#include <Arduino.h>
void setup() { Serial.begin(115200); pinMode(25, INPUT_PULLUP); }
void loop() {
  Serial.println(digitalRead(25) == LOW ? "LEFT" : "RIGHT");
  delay(500);
}
```

Pass: the text changes when you move the switch. LEFT = LOW. RIGHT = HIGH.

**F. Test 4: Wi-Fi and WebSocket**

1. Turn on the phone hotspot. Set it to 2.4 GHz. Connect the laptop to the same hotspot.
2. Find the laptop IP. On Windows run `ipconfig` and read the IPv4 address.
3. On the laptop run this fake server (`pip install websockets` first). Save it as `fake_server.py`:

```python
import asyncio, websockets

async def handler(ws):
    print("device connected")
    async for msg in ws:
        print(msg)

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8000):
        await asyncio.Future()

asyncio.run(main())
```

4. Upload this firmware. Change `SSID`, `PASS` and `HOST`:

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
const char* SSID = "your-hotspot";
const char* PASS = "your-password";
const char* HOST = "192.168.x.x";  // laptop IP
WebSocketsClient ws;
void setup() {
  Serial.begin(115200);
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println(WiFi.localIP());
  ws.begin(HOST, 8000, "/ws/device?token=test");
  ws.setReconnectInterval(2000);
}
void loop() {
  ws.loop();
  static unsigned long last = 0;
  if (millis() - last > 2000 && ws.isConnected()) {
    last = millis();
    String msg = String("{\"type\":\"tap\",\"pad\":3,\"hand\":\"left\",\"ms\":") + millis() + "}";
    ws.sendTXT(msg);
  }
}
```

Pass: `fake_server.py` prints a tap message every 2 seconds. Stop the server and start it again. The board must reconnect without a reset.

If the Windows firewall asks, allow Python on private networks. If nothing connects, check that both devices use the same hotspot.

**G. Final test**

Join the touch code (D), the switch code (E) and the WebSocket code (F). On each tap, send the `tap` message. When pad 6 stays touched for 2 seconds, send one `hold` message. Then test with Suryansh's real backend.

**Common faults**

| Fault                     | Fix                                                                 |
| ------------------------- | ------------------------------------------------------------------- |
| No COM port               | Change the USB cable. Install the CP210x driver.                    |
| "Connecting..." in upload | Hold the BOOT button.                                               |
| Pads fire alone           | Wires are too long or loose. Shorten them. Recalibrate at boot.     |
| Pad never fires           | Make the factor bigger (0.85). Check the solder or clip.            |
| Wi-Fi never connects      | Use 2.4 GHz. Check the name and password. Do not use college Wi-Fi. |
| WebSocket never connects  | Use the laptop IP. Same network. Allow Python in the firewall.      |

### Pad map

| Pad | Location | GPIO |
| --- | -------- | ---- |
| 1   | Thumb    | 4    |
| 2   | Index    | 13   |
| 3   | Middle   | 14   |
| 4   | Ring     | 27   |
| 5   | Little   | 32   |
| 6   | Palm     | 33   |

### Message formats

Tap:

```json
{ "type": "tap", "pad": 3, "hand": "left", "ms": 123456 }
```

Hold. Send this when the palm pad (6) stays touched for 2 seconds:

```json
{ "type": "hold", "pad": 6, "hand": "left", "ms": 123456 }
```

---

## Person 3: slides and demo script

### Slides

1. Title: Rehabit. "Recovery is a habit. We make it stick."
2. Problem. Stroke patients stop home exercises. About 1 in 3 has depression.
3. Solution. Low-cost touch board, games, AI voice, family updates.
4. Live demo.
5. Features. 4 game modes, voice coach, AI companion, reminder call, WhatsApp, dashboard.
6. Tech stack. ESP32, FastAPI, React, ElevenLabs, Sarvam, WhatsApp (we show the final provider).
7. Cost. About ₹1,000 per board (ESP32, switch, coins, cardboard).
8. Next steps. Test with real patients and therapists.
9. Team.

### Demo script (3 minutes)

1. Show the board. Say what it costs.
2. A judge plays Classic mode on the real board.
3. The voice coach speaks Hindi encouragement.
4. Hold the palm coin. Rehabit AI, the companion, starts. Say how you feel.
5. Show the dashboard. Progress and mood chart.
6. Show a WhatsApp message on a phone.
7. Press "Call now". The phone rings with the session reminder. Or play a recording of it.
8. Optional: tap fruits as pads.

### Rules

- Record a backup video of the full demo.
- Say "tracking and motivation". Do not say "diagnosis" or "treatment".

---

## Person 4: WhatsApp demo

We have two options. Test both. Then we choose one.

**Option A: OmniDimension**

1. Make an agent that sends WhatsApp messages.
2. Send one test message to your own phone.
3. Check the limit on test recipient numbers. Add the team phones.

**Option B: Meta WhatsApp Cloud API**

1. Open the Meta developer app. Add the WhatsApp product.
2. Use the test business number. Add your phone as the recipient.
3. Send the `hello_world` template with `POST https://graph.facebook.com/v23.0/<PHONE_NUMBER_ID>/messages` and the header `Authorization: Bearer <token>`.
4. The test token expires fast. Make a long-lived token before the demo.
5. Free-text messages work only inside 24 hours after the user writes to the number. Use approved templates for the other cases.

**For both options**

1. Make 3 message templates in Hindi and English: daily summary, missed session, low mood.
2. Tell Suryansh the URL, the token, and the message fields.
3. Test each event with a fake call from Suryansh's backend.
4. Prepare a phone to show the messages in the demo.
5. Decide with Suryansh by the end of day 2. Use the option that sends to all team phones with no errors.

---

## Tonight

- Suryansh: backend skeleton and fake device script.
- Dhruv: driver, hello test, touch test.
- Person 3: make the slide deck outline.
- Person 4: OmniDimension account and one test message.

## Before the demo

- [ ] Phone hotspot is on. It uses 2.4 GHz.
- [ ] The USB cable carries data.
- [ ] The power bank is charged.
- [ ] All API keys work.
- [ ] ngrok or Cloudflare Tunnel is running.
- [ ] The backup video is ready.
- [ ] The demo data is in the database.
- [ ] A team member has practiced the script 2 times.
