# Rehabit

Recovery is a habit. We make it stick.

## Problem

- Stroke patients must do hand exercises every day at home.
- Many patients stop when no therapist is present.
- About 1 in 3 stroke survivors has depression. Depression is linked to poorer recovery.
- Current rehab game systems need special hardware, such as hand controllers or motion sensors.

## Solution

We make a low-cost touch board for hand rehab.
The patient taps coins on a cardboard board.
The board sends each tap to a web app.
The web app shows rehab games.
An AI voice coach encourages the patient during play.
An AI companion talks with the patient about feelings.
The family gets updates on WhatsApp.
An AI phone call reminds the patient just before each daily session.

## Features

1. **Game modes**
   - Classic: tap the pad that glows. One game is 20 taps. No tap in 3 seconds is a miss, then the next pad glows.
   - Finger isolation: same as Classic, with fingertip pads 1 to 5 only. No palm.
   - Memory sequence: pads glow in order. The patient repeats the order. Start with 3 pads. Each correct round adds 1 pad. The game stops after 2 mistakes.
   - Endurance: tap the glowing pad as many times as you can in 60 seconds. Count correct taps.
2. **Voice coach**: Hinglish encouragement during play. We make the clips one time on the ElevenLabs website (free plan, a young and cheerful Hindi female voice) and save them as `frontend/public/clips/<id>.mp3` (`start`, `streak`, `miss`, `last5`, `end`). The game plays them on these events:

   | When | Clip |
   | --- | --- |
   | Game start | "Chaliye shuru karte hain!" |
   | 5 correct taps in a row | "Bahut badhiya! Aise hi karte raho." |
   | A miss | "Koi baat nahi, agla try karo." |
   | Last 5 taps | "Bas 5 aur! Aap kar sakte ho." |
   | Game end | "Shabash! Aaj ka session poora hua." |
3. **AI companion**: patient holds the palm pad for 2 seconds to start a talk. After the talk, the screen asks "How do you feel?". The patient taps pad 1 (bad) to 5 (good). We save this as the mood score.
4. **Reminder call**: a few minutes before the daily session time, the backend starts an AI call. The call tells the patient a game session is coming up.
5. **WhatsApp**: daily summary and alerts to family. Alerts: missed session (no game within 1 hour after session time) and low mood.
6. **Therapist dashboard**: progress per mode, mood vs reaction time, session history.
7. **Ankur, the mascot**: a small sprout in a clay pot. He speaks the coach lines in a round cloud thought bubble (thinking dots first, then the line). He reacts to game events: watching while a coin glows, happy on a good tap, cheer on a streak, encourage on a miss (never sad), push on the last 5 taps, celebrate (a flower blooms) when a game ends, comfort on a low mood. Patient screens only, not the dashboard. Design: `design/round-05-mascot/`.

## Hardware

- Board: ESP32-DevKitC-32E.
- Pads: 6 coins on cardboard, with a hand outline.
- Power: USB from laptop or power bank.

| Pad | Location | GPIO |
|---|---|---|
| 1 | Thumb | 4 |
| 2 | Index | 13 |
| 3 | Middle | 14 |
| 4 | Ring | 27 |
| 5 | Little | 32 |
| 6 | Palm | 33 |

- Hand switch: GPIO25, `INPUT_PULLUP`. LOW is left hand. HIGH is right hand.
- Do not use GPIO 0, 2, 12, 15. These pins control boot.
- `touchRead()` values go DOWN when touched on this chip.
- Calibrate each pad at boot. Do not touch pads during boot.
- Wi-Fi: use a phone hotspot on 2.4 GHz. Do not use college Wi-Fi.

## Tech stack

| Part | Tool |
|---|---|
| Firmware | PlatformIO, Arduino framework, board `esp32dev` |
| Device link | WebSocket, JSON messages |
| Backend | FastAPI (Python) |
| Frontend | React, TypeScript, Tailwind, Vite |
| Voice coach | ElevenLabs clips, made once on the website |
| AI companion | Sarvam Voice Agents (web SDK in the browser) |
| Reminder call | Sarvam Voice Agents (Instant Outbound API) |
| WhatsApp | OmniDimension or Meta WhatsApp Cloud API (not final). Use one `send_whatsapp()` function. |
| Tunnel | ngrok or Cloudflare Tunnel |

## Folder structure

```
rehabit/
  firmware/   PlatformIO project for ESP32
  backend/    FastAPI app
  frontend/   React app, one Vite project
    src/patient/     Play page at /
    src/therapist/   Dashboard page at /dashboard
    src/shared/      WebSocket hook, API calls, shared UI
```

## Data flow

1. ESP32 sends tap events to the backend WebSocket `/ws/device?token=DEVICE_TOKEN`.
2. Backend sends tap events to the frontend WebSocket `/ws/game`.
3. Frontend runs the game and sends session results to the backend.
4. Backend stores results and starts WhatsApp messages and calls.

Tap message format:

```json
{"type": "tap", "pad": 3, "hand": "right", "ms": 123456}
```

Hold message. The ESP32 sends it when the palm pad (6) stays touched for 2 seconds. This starts the AI companion:

```json
{"type": "hold", "pad": 6, "hand": "right", "ms": 123456}
```

## Commands

```
# Firmware
cd firmware
pio run -t upload
pio device monitor

# Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev
```

If upload stops at "Connecting...", hold the BOOT button on the board.

`--host 0.0.0.0` lets the board reach the backend over the hotspot. Without it the backend only listens on the laptop itself.

Firmware settings live in `firmware/include/secrets.h` (not committed). Copy `secrets.example.h` and fill in the hotspot name and password, the laptop IP (`ipconfig`), and the same `DEVICE_TOKEN` as in `.env`.

## Environment variables

Keep all keys in `.env`. Do not commit `.env`.

```
SARVAM_API_KEY=
SARVAM_ORG_ID=
SARVAM_WORKSPACE_ID=
SARVAM_COMPANION_APP_ID=
SARVAM_REMINDER_APP_ID=
SARVAM_REMINDER_APP_VERSION=1
SARVAM_CONNECTION_ID=
SARVAM_AGENT_PHONE_NUMBER=
OMNIDIM_API_KEY=
META_WA_TOKEN=
META_WA_PHONE_NUMBER_ID=
FAMILY_PHONE=
PATIENT_NAME=Ramesh Kumar
PATIENT_PHONE=
SESSION_TIME=18:00
REMINDER_MINUTES_BEFORE=10
MISSED_AFTER_MINUTES=60
DAILY_SUMMARY_TIME=21:00
DEVICE_TOKEN=
```

We use two Sarvam agents. The companion agent talks about feelings in the browser. The reminder agent makes the phone call. Each agent has its own prompt.

The reminder call needs a phone number and a telephony connection in the Sarvam workspace. The browser companion does not need them.

## Rules for Claude

- Keep code simple. This is a hackathon demo.
- Make the demo work first. Improve later.
- Test hardware changes on the real board before you continue.
- Do not use em-dashes in user-facing text.
- Use "we" in product text.
- Verify API details in official docs before you use them.
- Never put `SARVAM_API_KEY` in frontend code. The browser SDK calls a backend proxy (`baseUrl`). The backend adds the key.
- A palm hold is not a browser click. The patient must click "Start session" once on the page first. This unlocks audio and the microphone. Then a palm hold can start the companion. Microphone needs HTTPS or localhost.
- A palm hold starts the companion only on the menu screen. During a game, pad 6 is a normal pad and a hold does nothing.
- The companion proxy is one GET route. The SDK calls `{baseUrl}orgs/{org}/workspaces/{ws}/apps/{app}/url` to get a signed WebSocket URL. The audio then goes straight from the browser to Sarvam, not through our backend.

## Code style

- Do not create test files or test folders. Suryansh tests the backend by hand.
- Keep it simple. Pick the plainest solution that works.
- DRY. If logic repeats, move it into one function or module.
- All imports at the top of the file. No imports inside functions.
- Comments are short, plain and human. Write one only when the code is not obvious. Explain why, not what.
- Small functions that do one thing. Clear names, so the code reads without comments.
- No dead code, no commented-out code, no unused imports or variables.
- No magic numbers. Put values like the 150 ms debounce or the 3 second tap timeout in one config place.
- Config and keys come from `.env` through one settings module. Never hardcode them.
- Fail loudly with clear errors. Do not swallow exceptions silently.
- Follow the language style: PEP 8 for Python, and the usual TypeScript and React patterns.