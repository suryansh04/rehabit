"""Make the voice coach clips once with Sarvam TTS. Run: python make_clips.py

The lines match frontend/src/patient/coach.ts. Clips go to frontend/public/clips/.
"""
import base64

import httpx

from config import ROOT, settings

TTS_URL = "https://api.sarvam.ai/text-to-speech"
CLIPS_DIR = ROOT / "frontend" / "public" / "clips"
SPEAKER = "priya"
LANGUAGE = "hi-IN"

LINES = {
    "start": "Chaliye shuru karte hain!",
    "streak": "Bahut badhiya! Aise hi karte raho.",
    "miss": "Koi baat nahi, agla try karo.",
    "last5": "Bas 5 aur! Aap kar sakte ho.",
    "end": "Shabash! Aaj ka session poora hua.",
}


def make_clip(client: httpx.Client, clip: str, text: str) -> None:
    res = client.post(TTS_URL, json={"text": text, "language_code": LANGUAGE, "model": "bulbul:v3", "speaker": SPEAKER})
    res.raise_for_status()
    (CLIPS_DIR / f"{clip}.wav").write_bytes(base64.b64decode(res.json()["audios"][0]))
    print(f"saved {clip}.wav")


def main() -> None:
    if not settings.sarvam_api_key:
        raise SystemExit("SARVAM_API_KEY is missing in .env")
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    with httpx.Client(headers={"api-subscription-key": settings.sarvam_api_key}, timeout=30) as client:
        for clip, text in LINES.items():
            make_clip(client, clip, text)


if __name__ == "__main__":
    main()
