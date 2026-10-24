# Rehabit App Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the Rehabit backend (FastAPI) and frontend (React), so a patient can play the 4 games on the touch board, talk to the companion, and log a mood. A therapist sees progress and can trigger the reminder call.

**Architecture:** The ESP32 (or `fake_device.py`) sends taps to `/ws/device`. The backend sends them to every browser on `/ws/game`. The browser runs the games and posts results to REST. A one-minute scheduler loop does the reminder call, the missed-session alert and the daily summary.

**Tech Stack:** FastAPI, SQLite (stdlib `sqlite3`), httpx, pydantic-settings. React 19 + TypeScript + Vite + Tailwind v4, `@fontsource/plus-jakarta-sans`, `lucide-react`, `react-router-dom`, `sarvam-conv-ai-sdk`.

**Spec:** `CLAUDE.md`, `WORK.md`, `design/NOTES.md`. Mockups: `design/round-04-play/`.

## Global Constraints

- No test files or test folders. Verify each task by hand with the commands in its "Verify" step (CLAUDE.md, Code style).
- Simple, DRY, all imports at the top, short human comments only where needed, no dead code, no magic numbers. Config comes from `.env` through `backend/config.py` and `frontend/src/shared/config.ts`.
- No em-dashes in user-facing text. Use "we" in product text.
- Never put `SARVAM_API_KEY` in frontend code.
- A palm hold starts the companion only on the menu screen.
- The design is Soft Bento: bg `#F3F0FA`, surface `#FFFFFF`, ink `#1B1530`, muted `#5F5979`, accent `#6B4EF6`, mint `#DDF5E8`, peach `#FFE7D9`, lilac `#E9E3FF`, line `#E4DEF5`. Plus Jakarta Sans 500/700. 28px cards, pill buttons.
- Commit after each task.

## File map

```
backend/
  config.py        Settings from ../.env
  db.py            SQLite schema, queries, demo seed
  ws.py            Device and game WebSocket hub
  api.py           REST routes
  sarvam.py        Outbound call + companion proxy
  whatsapp.py      send_whatsapp(event, data), print stub
  scheduler.py     One-minute loop: reminder, missed, daily summary
  main.py          App, CORS, routers, scheduler start
  fake_device.py   Dev tool: type 1-6 / hold / auto
  make_clips.py    One-time voice clip generation
frontend/src/
  main.tsx                     Router: / and /dashboard
  index.css                    Tailwind import + theme tokens + font
  shared/config.ts             Game numbers, API base
  shared/types.ts              Tap, Session, Mode types
  shared/api.ts                fetch helpers
  shared/useDeviceSocket.ts    /ws/game + keyboard fallback
  shared/HandBoard.tsx         Hand SVG with 6 coins (geometry from design)
  shared/Ring.tsx              20-tick progress ring
  patient/PlayPage.tsx         Screen state machine
  patient/MenuScreen.tsx, GameScreen.tsx, TalkScreen.tsx, MoodScreen.tsx, DoneScreen.tsx
  patient/games/useGame.ts     Shared game engine (target, timeout, stats)
  patient/games/modes.ts       The 4 mode rules
  patient/useCoach.ts          Clip playback on game events
  therapist/DashboardPage.tsx  Sidebar + bento tiles
  therapist/charts.tsx         Sparkline, Bars, Scatter
```

## Contracts used across tasks

- Device message (in and out): `{"type": "tap" | "hold", "pad": 1-6, "hand": "left" | "right", "ms": number}`
- `POST /api/session` body: `{mode, hand, duration_s, taps, correct, avg_reaction_ms, accuracy, score}` returns `{id}`. The server sets `started_at` (now minus duration), so one clock drives the schedule
- `GET /api/sessions` returns `[{...session, id, mood: number | null}]`, newest first
- `POST /api/mood` body `{score: 1-5}` returns `{id, session_id}`. If the score is 2 or lower, it calls `send_whatsapp("low_mood", {...})`.
- `POST /api/call-now` returns `{attempt_id}`
- `GET /api/sarvam/{path}` forwards to `https://apps.sarvam.ai/api/app-runtime/{path}?{query}` with `X-API-Key`
- `GET /api/config` returns `{patient_name, session_time, org_id, workspace_id, companion_app_id}` (no secrets)
- Mode ids: `classic`, `finger`, `memory`, `endurance`

---

### Task 1: Backend core (config, db, WebSockets, REST)

**Files:** Create `backend/config.py`, `backend/db.py`, `backend/ws.py`, `backend/api.py`, `backend/main.py`

- [ ] `config.py`: a `Settings(BaseSettings)` class that reads `../.env`, with every key from `.env.example` (typed: `SESSION_TIME: str`, minutes as `int`), plus `DB_PATH = "rehabit.db"`. Export `settings`.
- [ ] `db.py`: `init_db()` creates `sessions` and `moods`. Also `add_session(data) -> int`, `list_sessions() -> list[dict]` (LEFT JOIN the latest mood per session), `add_mood(score) -> (id, session_id)`, `sessions_on(date) -> list[dict]`, and `seed_demo()` (7 days, 2 to 3 sessions a day, all 4 modes, improving numbers, moods 2 to 4). Seed only when `sessions` is empty.
- [ ] `ws.py`: `/ws/device` closes with code 1008 when `token != settings.DEVICE_TOKEN`. Each message is validated with `json.loads`, then sent to every client in the `game_clients` set. `/ws/game` adds the client to the set and removes it on disconnect.
- [ ] `api.py`: the routes from "Contracts" above (not call-now and the proxy yet). Pydantic models `SessionIn` and `MoodIn` with `score: int = Field(ge=1, le=5)`.
- [ ] `main.py`: CORS for `http://localhost:5173`, include the routers, run `init_db()` and `seed_demo()` on startup.
- [ ] **Verify:** `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`, then `curl localhost:8000/api/sessions` returns the seeded list, and `curl -X POST localhost:8000/api/mood -H "Content-Type: application/json" -d "{\"score\":4}"` returns an id.
- [ ] Commit `Backend core: db, websockets, REST`.

### Task 2: Fake device

**Files:** Create `backend/fake_device.py`

- [ ] Connect to `ws://localhost:8000/ws/device?token=<DEVICE_TOKEN>` with `websockets`. Read lines from input: `1` to `6` sends a tap, `h` sends a hold on pad 6, `l` or `r` switches the hand, `auto` sends a random tap every 0.8 s until Ctrl+C. Use `ms = int(time.monotonic() * 1000)`.
- [ ] **Verify:** run the backend, open `websocat ws://localhost:8000/ws/game` (or the browser in Task 3), type `3` in fake_device, and the tap JSON arrives.
- [ ] Commit `Fake device dev tool`.

### Task 3: Frontend scaffold, hand and socket

**Files:** Create the Vite app in `frontend/` (keep the existing folders), `index.css`, `main.tsx`, `shared/*`

- [ ] `npm create vite@latest` into a temp folder (react-ts), copy it into `frontend/`, and install `tailwindcss @tailwindcss/vite react-router-dom lucide-react @fontsource/plus-jakarta-sans sarvam-conv-ai-sdk`.
- [ ] `index.css`: `@import "tailwindcss";` and a `@theme` block with the Soft Bento colors as `--color-*`, `--font-sans: "Plus Jakarta Sans"`, and `--radius-card: 28px`.
- [ ] `shared/HandBoard.tsx`: port `FINGERS`, `PALM`, `COIN_AT` and `point()` from `design/hand/hand.py`. Props: `{ live?: number | null; hit?: number | null; miss?: number | null; hand: "left" | "right"; size: number }`. The left hand is `scale(-1,1)` on the shapes only, so the coin numbers stay readable.
- [ ] `shared/Ring.tsx`: props `{ lit: number; total: number; size: number; showTicks?: boolean; children }`.
- [ ] `shared/useDeviceSocket.ts`: connects to `/ws/game`, reconnects after 1 s, and calls `onEvent(msg)`. Keyboard keys 1 to 6 give a tap, and holding 6 for 2 s gives a hold.
- [ ] **Verify:** `npm run dev`. A temp page shows HandBoard, and a tap from fake_device (or the keyboard) lights the right coin.
- [ ] Commit `Frontend scaffold, hand board, socket`.

### Task 4: Play flow with Classic

**Files:** `patient/PlayPage.tsx`, the 5 screen files, `patient/games/useGame.ts`, `patient/games/modes.ts`

- [ ] `modes.ts`: `MODES: Record<ModeId, {name, blurb, pads: number[], kind: "taps" | "timed" | "sequence", total?: number, seconds?: number}>`, with values from `config.ts` (20 taps, 3 s timeout, 60 s, memory starts at 3 and allows 2 mistakes).
- [ ] `useGame.ts`: for the `taps` kind, pick a random pad (not the same twice), start a timeout, and record a hit with its reaction ms, or a miss on timeout or a wrong pad. It exposes `{target, good, total, streak, lastMs, misses, done, result}`. `result` matches the `POST /api/session` body.
- [ ] The screens follow the round-04 mockups. Menu: the Start session click also unlocks audio. A hold on the menu goes to Talk. Done: posts the session once, with Play again and Back to games.
- [ ] **Verify:** play a full Classic game with fake_device `auto` and the keyboard. The session shows up in `GET /api/sessions`.
- [ ] Commit `Play flow with Classic game`.

### Task 5: Other modes and hand switch

- [ ] Finger isolation uses pads 1 to 5. Endurance: timed 60 s, counts correct taps, with no timeout misses. Memory: show the sequence (600 ms per pad), the patient repeats it, a correct round adds 1 pad, and the game ends after 2 mistakes. Score is the longest correct length.
- [ ] The hand comes from the last device message. HandBoard flips.
- [ ] **Verify:** play each mode once. The dashboard data has the 4 modes.
- [ ] Commit `Finger isolation, memory, endurance, hand switch`.

### Task 6: Voice coach

**Files:** `backend/make_clips.py`, `patient/useCoach.ts`

- [ ] `make_clips.py`: for the 5 clips in CLAUDE.md, `POST https://api.sarvam.ai/text-to-speech` with header `api-subscription-key`, body `{text, language_code: "hi-IN", model: "bulbul:v3", speaker: "priya"}`. Decode `audios[0]` (base64 WAV) to `frontend/public/clips/{start,streak,miss,last5,end}.wav`.
- [ ] `useCoach(events)` plays a clip on start, on every 5th streak, on a miss (at most once per 4 s), when 5 are left, and at the end. The coach bubble text matches the clip.
- [ ] **Verify:** run the script, play Classic, and hear the clips.
- [ ] Commit `Voice coach clips`.

### Task 7: Companion and mood

**Files:** `backend/sarvam.py` (proxy), `api.py` (`/api/config`), `TalkScreen.tsx`, `MoodScreen.tsx`

- [ ] Proxy: `GET /api/sarvam/{path:path}` uses httpx to forward the path and query, adds `X-API-Key`, and returns the status and body.
- [ ] TalkScreen: `new ConversationAgent({apiKey: "", baseUrl: "http://localhost:8000/api/sarvam/", config: {org_id, workspace_id, app_id: companion_app_id, user_identifier: "patient", user_identifier_type: "custom", interaction_type: InteractionType.CALL, input_sample_rate: 16000, output_sample_rate: 16000}, audioInterface: new BrowserAudioInterface(), transcriptCallback, endCallback})`. The transcript goes to the chat bubbles. End talk, or the agent ending, goes to Mood.
- [ ] MoodScreen: a tap on pads 1 to 5 calls `POST /api/mood`, then the screen goes back to Menu. Pad 6 is ignored.
- [ ] **Verify:** hold pad 6 on the menu, talk, end, and tap 2. The backend prints the `low_mood` WhatsApp stub.
- [ ] Commit `Companion talk and mood`.

### Task 8: WhatsApp stub, reminder call, scheduler

**Files:** `backend/whatsapp.py`, `backend/sarvam.py` (call), `backend/scheduler.py`, `api.py` (call-now), `main.py`

- [ ] `send_whatsapp(event, data)` prints `[whatsapp] {event}: {data}`. This is the only place that changes when the provider is chosen.
- [ ] `start_reminder_call() -> str`: `POST https://apps.sarvam.ai/api/outbounds/v1/orgs/{org}/workspaces/{ws}/outbounds` with `app_config {app_id: REMINDER_APP_ID, app_version, connection_config {connection_id, agent_phone_number}}` and `user_config {user_phone_number: PATIENT_PHONE}`. It returns `attempt_id` and raises on a non-200 response.
- [ ] `scheduler.py`: an asyncio loop every 60 s with a `sent: dict[str, date]` guard. Reminder at session time minus `REMINDER_MINUTES_BEFORE`. `missed_session` at session time plus `MISSED_AFTER_MINUTES` if there is no session today. `daily_summary` at `DAILY_SUMMARY_TIME`, with taps, the avg reaction trend and the streak.
- [ ] **Verify:** `curl -X POST localhost:8000/api/call-now` makes the phone ring. Set `SESSION_TIME` 2 minutes ahead and watch the logs.
- [ ] Commit `Reminder call, scheduler, WhatsApp stub`.

### Task 9: Dashboard

**Files:** `therapist/DashboardPage.tsx`, `therapist/charts.tsx`

- [ ] Follow the round-04 `dash` mockup: a sidebar (only Overview works, the rest are visual), 4 mode tiles (latest score plus a sparkline per day), reaction bars for the last 7 days, the mood vs reaction scatter, the dark Next session tile with Call now (shows "Calling..." then "Call started" or the error), and a history table of 8 rows.
- [ ] All numbers come from `GET /api/sessions`, grouped on the client by mode and day.
- [ ] **Verify:** open `/dashboard` with seed data. Every tile has data, and Call now works.
- [ ] Commit `Therapist dashboard`.
