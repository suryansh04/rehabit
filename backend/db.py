import random
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime, timedelta

from config import settings

SESSION_FIELDS = ("mode", "hand", "started_at", "duration_s", "taps", "correct", "avg_reaction_ms", "accuracy", "score")

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    hand TEXT NOT NULL,
    started_at TEXT NOT NULL,
    duration_s REAL NOT NULL,
    taps INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    avg_reaction_ms REAL NOT NULL,
    accuracy REAL NOT NULL,
    score REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES sessions(id),
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
"""


@contextmanager
def connect():
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)


def add_session(data: dict) -> int:
    with connect() as conn:
        cols = ", ".join(SESSION_FIELDS)
        marks = ", ".join("?" for _ in SESSION_FIELDS)
        cur = conn.execute(f"INSERT INTO sessions ({cols}) VALUES ({marks})", [data[f] for f in SESSION_FIELDS])
        return cur.lastrowid


def list_sessions() -> list[dict]:
    with connect() as conn:
        rows = conn.execute("""
            SELECT s.*, (SELECT m.score FROM moods m WHERE m.session_id = s.id
                         ORDER BY m.created_at DESC LIMIT 1) AS mood
            FROM sessions s ORDER BY s.started_at DESC""").fetchall()
        return [dict(r) for r in rows]


def sessions_on(day: date) -> list[dict]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM sessions WHERE date(started_at) = ? ORDER BY started_at",
                            (day.isoformat(),)).fetchall()
        return [dict(r) for r in rows]


def session_days() -> set[date]:
    with connect() as conn:
        rows = conn.execute("SELECT DISTINCT date(started_at) AS d FROM sessions").fetchall()
        return {date.fromisoformat(r["d"]) for r in rows}


def add_mood(score: int) -> tuple[int, int | None]:
    with connect() as conn:
        latest = conn.execute("SELECT id FROM sessions ORDER BY started_at DESC LIMIT 1").fetchone()
        session_id = latest["id"] if latest else None
        cur = conn.execute("INSERT INTO moods (session_id, score, created_at) VALUES (?, ?, ?)", (session_id, score, now()))
        return cur.lastrowid, session_id


def _demo_session(mode: str, day_index: int, start: datetime) -> dict:
    # day_index 0 is the oldest day, so numbers improve towards today
    progress = day_index / 6
    reaction = round(530 - 115 * progress + random.uniform(-12, 12))
    taps, correct, duration = 20, round(12 + 6 * progress + random.uniform(0, 1.5)), 75.0
    score = round(correct / taps * 100)
    if mode == "memory":
        taps, correct, duration = 24, 20, 90.0
        score = 3 + round(3 * progress)
    elif mode == "endurance":
        correct = round(38 + 23 * progress + random.uniform(-2, 2))
        taps, duration, score = correct + random.randint(2, 6), 60.0, correct
    elif mode == "finger":
        score = round(score * 0.9)
    return {"mode": mode, "hand": "left" if day_index == 4 else "right",
            "started_at": start.isoformat(timespec="seconds"), "duration_s": duration, "taps": taps,
            "correct": correct, "avg_reaction_ms": reaction, "accuracy": round(correct / taps * 100, 1), "score": score}


def seed_demo() -> None:
    with connect() as conn:
        if conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]:
            return
    modes = ["classic", "finger", "memory", "endurance"]
    moods = [2, 3, 3, 3, 4, 4, 4]
    # the 7 days before today, so today stays empty for the live demo
    evening = datetime.now().replace(hour=18, minute=4, second=0, microsecond=0)
    for i in range(7):
        start = evening - timedelta(days=7 - i)
        for j in range(2 + i % 2):
            add_session(_demo_session(modes[(i + j) % 4], i, start + timedelta(minutes=6 * j)))
        with connect() as conn:
            latest = conn.execute("SELECT id FROM sessions ORDER BY started_at DESC LIMIT 1").fetchone()["id"]
            conn.execute("INSERT INTO moods (session_id, score, created_at) VALUES (?, ?, ?)",
                         (latest, moods[i], (start + timedelta(minutes=20)).isoformat(timespec="seconds")))
