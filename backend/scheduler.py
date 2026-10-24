import asyncio
from datetime import date, datetime, time, timedelta

import db
from config import settings
from sarvam import start_reminder_call
from whatsapp import send_whatsapp

CHECK_EVERY_S = 60
TREND_DAYS = 7


def at_today(hhmm: str, shift_minutes: int = 0) -> datetime:
    return datetime.combine(date.today(), time.fromisoformat(hhmm)) + timedelta(minutes=shift_minutes)


def streak(today: date) -> int:
    days = db.session_days()
    day = today if today in days else today - timedelta(days=1)
    count = 0
    while day in days:
        count += 1
        day -= timedelta(days=1)
    return count


def daily_summary(today: date) -> dict:
    sessions = db.sessions_on(today)
    week_ago = db.sessions_on(today - timedelta(days=TREND_DAYS))

    def avg_reaction(rows):
        # a game with no good taps has no reaction time
        times = [s["avg_reaction_ms"] for s in rows if s["avg_reaction_ms"] > 0]
        return round(sum(times) / len(times)) if times else None

    return {
        "sessions": len(sessions),
        "taps": sum(s["taps"] for s in sessions),
        "avg_reaction_ms": avg_reaction(sessions),
        "avg_reaction_ms_week_ago": avg_reaction(week_ago),
        "streak_days": streak(today),
    }


async def reminder_job() -> None:
    await start_reminder_call()


def missed_job() -> None:
    if not db.sessions_on(date.today()):
        send_whatsapp("missed_session", {"session_time": settings.session_time, "patient": settings.patient_name})


def summary_job() -> None:
    send_whatsapp("daily_summary", daily_summary(date.today()))


async def run_scheduler() -> None:
    """Every minute, run each daily job once when its time has come."""
    done: dict[str, date] = {}
    jobs = {
        "reminder": (lambda: at_today(settings.session_time, -settings.reminder_minutes_before), reminder_job),
        "missed": (lambda: at_today(settings.session_time, settings.missed_after_minutes), missed_job),
        "summary": (lambda: at_today(settings.daily_summary_time), summary_job),
    }
    # jobs whose time already passed when we start are skipped for today
    started = datetime.now()
    for name, (due, _) in jobs.items():
        if due() <= started:
            done[name] = date.today()

    while True:
        now = datetime.now()
        for name, (due, job) in jobs.items():
            if done.get(name) != date.today() and now >= due():
                done[name] = date.today()
                try:
                    result = job()
                    if asyncio.iscoroutine(result):
                        await result
                except Exception as error:
                    # one failed job must not stop the others; the demo has a recorded call as backup
                    print(f"[scheduler] {name} job failed: {error}", flush=True)
        await asyncio.sleep(CHECK_EVERY_S)
