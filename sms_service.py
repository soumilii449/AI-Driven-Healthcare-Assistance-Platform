import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


class SMSError(Exception):
    pass


def send_sms(to_number: str, message: str = ""):
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.environ.get("TWILIO_FROM_NUMBER", "").strip()

    if not (account_sid and auth_token and from_number):
        raise SMSError(
            "Twilio is not configured on the server. Set "
            "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and "
            "TWILIO_FROM_NUMBER in the backend .env file."
        )

    to_number = (to_number or "").strip()

    if not to_number:
        raise SMSError("No destination phone number was provided.")

    client = Client(account_sid, auth_token)

    try:
        sms = client.messages.create(
            body="sms_account_alerts",
            from_=from_number,
            to=to_number,
        )
    except TwilioRestException as exc:
        raise SMSError(f"Twilio could not send the SMS: {exc.msg}")

    return {
        "sid": sms.sid,
        "status": sms.status,
        "to": to_number,
    }