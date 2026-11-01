"""Minimal Sarvam SDK smoke test. Reads the key from the environment; never prints it."""
import os
import sys

from sarvamai import SarvamAI

key = os.environ.get("SARVAM_API_KEY") or os.environ.get("SARVAM_API")
if not key:
    sys.exit("SARVAM_API_KEY is not set in the environment. Configure .env and retry.")

client = SarvamAI(api_subscription_key=key)
resp = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[{"role": "user", "content": "Reply with one short greeting in Hindi."}],
)
print("model: sarvam-105b-conversations | SDK op: client.chat.completions | status: OK")
print("reply:", resp.choices[0].message.content)
