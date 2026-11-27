"""Rings a representative's phone through Twilio: one spoken line, then hang up. No conversation is connected."""
import base64
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

import config  # noqa: F401  (loads .env files)

COOLDOWN_S = 30
# What the call says: a 2-second pause, then one line. Trial Twilio accounts refuse inline TwiML, so the
# call fetches it from Twilio's echo twimlet. REP_CALL_TWIML_URL (e.g. a TwiML Bin) replaces it.
REP_CALL_LINE = os.getenv("REP_CALL_LINE") or (
    "This is a demo recording. In a real scenario, you would be talking to a representative."
)
_TWIML = f'<Response><Pause length="2"/><Say voice="Polly.Joanna">{REP_CALL_LINE}</Say></Response>'
TWIML_URL = os.getenv("REP_CALL_TWIML_URL") or "https://twimlets.com/echo?" + urllib.parse.urlencode({"Twiml": _TWIML})
_last = 0.0


def call_representative() -> tuple[bool, str]:
    global _last
    sid, token = os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN")
    frm, to = os.getenv("TWILIO_FROM_NUMBER"), os.getenv("REP_CALL_TO")
    if not (sid and token and frm and to):
        return False, "Calling a representative isn't set up right now."
    if time.time() - _last < COOLDOWN_S:
        return True, "A representative is already being called."
    req = urllib.request.Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Calls.json",
        data=urllib.parse.urlencode({"To": to, "From": frm, "Url": TWIML_URL}).encode(),
        headers={"Authorization": "Basic " + base64.b64encode(f"{sid}:{token}".encode()).decode()},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15):
            pass
    except urllib.error.HTTPError as e:
        try:
            detail = json.loads(e.read()).get("message", "")
        except Exception:
            detail = ""
        print(f"Twilio call failed: {e.code} {detail}")
        return False, "The call couldn't be placed just now."
    except Exception as e:  # network
        print(f"Twilio call failed: {e}")
        return False, "The call couldn't be placed just now."
    _last = time.time()
    return True, "A representative's phone is ringing now."
