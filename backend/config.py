from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    sarvam_api_key: str = ""
    sarvam_org_id: str = ""
    sarvam_workspace_id: str = ""
    sarvam_companion_app_id: str = ""
    sarvam_reminder_app_id: str = ""
    sarvam_reminder_app_version: int = 1
    sarvam_connection_id: str = ""
    sarvam_agent_phone_number: str = ""

    omnidim_api_key: str = ""
    meta_wa_token: str = ""
    meta_wa_phone_number_id: str = ""

    family_phone: str = ""
    patient_name: str = "Ramesh Kumar"
    patient_phone: str = ""

    session_time: str = "18:00"
    reminder_minutes_before: int = 10
    missed_after_minutes: int = 60
    daily_summary_time: str = "21:00"

    device_token: str = ""
    frontend_origin: str = "http://localhost:5173"
    db_path: Path = Path(__file__).resolve().parent / "rehabit.db"


settings = Settings()
