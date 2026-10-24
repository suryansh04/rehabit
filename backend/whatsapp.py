from config import settings


def send_whatsapp(event: str, data: dict) -> None:
    """The one place that talks to the WhatsApp provider.

    The provider (OmniDimension or Meta Cloud API) is not chosen yet, so this only prints.
    Events: daily_summary, missed_session, low_mood.
    """
    print(f"[whatsapp] to {settings.family_phone or 'family'} | {event}: {data}", flush=True)
