"""Run from the backend directory: python test_email.py"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"
API_KEY = os.getenv("SENDGRID_API_KEY", "")
FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "")
TO_EMAIL = FROM_EMAIL  # send to yourself as a test

if not API_KEY:
    print("✗ SENDGRID_API_KEY not set in .env")
    raise SystemExit(1)
if not FROM_EMAIL:
    print("✗ SENDGRID_FROM_EMAIL not set in .env")
    raise SystemExit(1)

payload = {
    "personalizations": [{"to": [{"email": TO_EMAIL}]}],
    "from": {"email": FROM_EMAIL, "name": "HSE Platform Test"},
    "subject": "SendGrid Test",
    "content": [{"type": "text/plain", "value": "If you receive this, SendGrid is working."}],
}

print(f"Sending test email from {FROM_EMAIL} to {TO_EMAIL} ...")
try:
    with httpx.Client(timeout=15, verify=False) as client:
        r = client.post(
            SENDGRID_API_URL,
            json=payload,
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        )
    print(f"Status: {r.status_code}")
    print(f"Body:   {r.text}")
    if r.status_code in (200, 202):
        print("\n✓ Email accepted by SendGrid — check your inbox (and spam folder)")
    elif r.status_code == 403:
        print("\n✗ 403 Forbidden — sender email is NOT verified in SendGrid")
        print(f"  Fix: Go to https://app.sendgrid.com/settings/sender_auth/senders")
        print(f"  and add '{FROM_EMAIL}' as a verified single sender.")
    elif r.status_code == 401:
        print("\n✗ 401 Unauthorized — API key is invalid or lacks 'Mail Send' permission")
    else:
        print(f"\n✗ Unexpected error — see body above")
except Exception as e:
    print(f"\n✗ Exception: {e}")
