import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")

client = Client(account_sid, auth_token)

message = client.messages.create(
    content_sid="HXb131895de71a093156d1062e878de57c",
    from_="whatsapp:+17372508034",
    to="whatsapp:+919874054215",
)

print("Message SID:", message.sid)
print("Status:", message.status)