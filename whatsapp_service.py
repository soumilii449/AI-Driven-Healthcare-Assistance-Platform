import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


class WhatsAppError(Exception):
    pass


def send_whatsapp(to_number: str):
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()

    if not account_sid or not auth_token:
        raise WhatsAppError(
            "Twilio is not configured. Set TWILIO_ACCOUNT_SID and "
            "TWILIO_AUTH_TOKEN in the backend .env file."
        )

    to_number = (to_number or "").strip()

    if not to_number:
        raise WhatsAppError("No WhatsApp destination number was provided.")

    if not to_number.startswith("whatsapp:"):
        to_number = f"whatsapp:{to_number}"

    from_number = "whatsapp:+17372508034"

    client = Client(account_sid, auth_token)

    try:
        message = client.messages.create(
            content_sid="HXb131895de71a093156d1062e878de57c",
            from_=from_number,
            to=to_number,
        )
    except TwilioRestException as exc:
        raise WhatsAppError(
            f"Twilio could not send the WhatsApp message: {exc.msg}"
        )

    return {
        "sid": message.sid,
        "status": message.status,
        "to": to_number,
    }