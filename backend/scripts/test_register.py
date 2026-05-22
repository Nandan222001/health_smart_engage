import httpx
import json

url = "http://localhost:8000/api/v1/auth/register"
payload = {
    "email": "acme@example.com",
    "password": "123456789",
    "confirm_password": "123456789",
    "organization_code": "ACME2024",
    "name": "Acme Corporation"
}

try:
    r = httpx.post(url, json=payload, timeout=10.0)
    print(r.status_code)
    print(r.text)
except Exception as e:
    print('ERROR', e)
