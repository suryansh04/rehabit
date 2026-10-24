from datetime import datetime, timedelta
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import db
import elevenlabs
import sarvam
from config import settings
from whatsapp import send_whatsapp

LOW_MOOD_MAX = 2

router = APIRouter(prefix="/api")


class SessionIn(BaseModel):
    mode: Literal["classic", "finger", "memory", "endurance"]
    hand: Literal["left", "right"]
    duration_s: float = Field(ge=0)
    taps: int = Field(ge=0)
    correct: int = Field(ge=0)
    avg_reaction_ms: float = Field(ge=0)
    accuracy: float = Field(ge=0, le=100)
    score: float = Field(ge=0)


class MoodIn(BaseModel):
    score: int = Field(ge=1, le=5)


@router.post("/session")
def save_session(body: SessionIn):
    # the server clock is the one clock we trust for the daily schedule
    started = datetime.now() - timedelta(seconds=body.duration_s)
    data = body.model_dump() | {"started_at": started.isoformat(timespec="seconds")}
    return {"id": db.add_session(data)}


@router.get("/sessions")
def get_sessions():
    return db.list_sessions()


@router.post("/mood")
def save_mood(body: MoodIn):
    mood_id, session_id = db.add_mood(body.score)
    if body.score <= LOW_MOOD_MAX:
        send_whatsapp("low_mood", {"score": body.score, "patient": settings.patient_name})
    return {"id": mood_id, "session_id": session_id}


@router.post("/call-now")
async def call_now():
    try:
        return {"attempt_id": await sarvam.start_reminder_call()}
    except (RuntimeError, httpx.HTTPError) as error:
        raise HTTPException(status_code=502, detail=str(error))


@router.get("/companion/token")
async def companion_token():
    try:
        return {"token": await elevenlabs.conversation_token()}
    except (RuntimeError, httpx.HTTPError) as error:
        raise HTTPException(status_code=502, detail=str(error))


@router.get("/config")
def public_config():
    return {
        "patient_name": settings.patient_name,
        "session_time": settings.session_time,
        "reminder_minutes_before": settings.reminder_minutes_before,
        "missed_after_minutes": settings.missed_after_minutes,
        "daily_summary_time": settings.daily_summary_time,
    }
