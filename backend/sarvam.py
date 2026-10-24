import httpx

from config import settings

OUTBOUND_URL = "https://apps.sarvam.ai/api/outbounds/v1/orgs/{org}/workspaces/{workspace}/outbounds"
TIMEOUT_S = 20


def _headers() -> dict:
    if not settings.sarvam_api_key:
        raise RuntimeError("SARVAM_API_KEY is missing in .env")
    return {"X-API-Key": settings.sarvam_api_key}


async def start_reminder_call() -> str:
    url = OUTBOUND_URL.format(org=settings.sarvam_org_id, workspace=settings.sarvam_workspace_id)
    body = {
        "app_config": {
            "app_id": settings.sarvam_reminder_app_id,
            "app_version": settings.sarvam_reminder_app_version,
            "connection_config": {
                "connection_id": settings.sarvam_connection_id,
                "agent_phone_number": settings.sarvam_agent_phone_number,
            },
            "agent_variables": {
                "patient_name": settings.patient_name,
                "session_time": settings.session_time,
            },
        },
        "user_config": {"user_phone_number": settings.patient_phone},
    }
    async with httpx.AsyncClient(timeout=TIMEOUT_S) as client:
        res = await client.post(url, json=body, headers=_headers())
    if res.status_code != 200:
        raise RuntimeError(f"Sarvam outbound call failed: {res.status_code} {res.text}")
    attempt_id = res.json()["attempt_id"]
    print(f"[call] reminder call started, attempt {attempt_id}")
    return attempt_id
