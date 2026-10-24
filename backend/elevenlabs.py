import httpx

from config import settings

TOKEN_URL = "https://api.elevenlabs.io/v1/convai/conversation/token"
TIMEOUT_S = 20


async def conversation_token() -> str:
    """A short-lived token so the browser can talk to Rehabit AI without our API key."""
    if not settings.elevenlabs_api_key or not settings.elevenlabs_agent_id:
        raise RuntimeError("ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID is missing in .env")
    async with httpx.AsyncClient(timeout=TIMEOUT_S) as client:
        res = await client.get(
            TOKEN_URL,
            params={"agent_id": settings.elevenlabs_agent_id},
            headers={"xi-api-key": settings.elevenlabs_api_key},
        )
    if res.status_code != 200:
        raise RuntimeError(f"ElevenLabs token failed: {res.status_code} {res.text}")
    return res.json()["token"]
