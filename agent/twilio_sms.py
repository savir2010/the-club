"""Nora's texting through Twilio (NORA_SMS_PROVIDER=twilio) instead of iMessage on this Mac.

Out: each bubble is one Twilio message from TWILIO_FROM_NUMBER.
In:  Twilio posts each incoming text to the shop's public address, /api/nora/sms/twilio, which
     passes it here. Every request is checked against Twilio's signature (X-Twilio-Signature).
The webhook is pointed at the shop automatically once the public address is known, when
TWILIO_FROM_NUMBER is a number this account owns (a trial "try it" sender cannot receive).

Trial accounts can't text for Nora: they may only send Twilio's predefined templates (error 572006),
so this needs an upgraded account (and US A2P 10DLC or toll-free verification to reach any number).
"""
import base64
import hashlib
import hmac
import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request

import config  # noqa: F401  (loads .env files)

log = logging.getLogger("nora.twilio")

SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
FROM = os.getenv("TWILIO_FROM_NUMBER", "").strip()
WEBHOOK_PATH = "/api/nora/sms/twilio"
API = f"https://api.twilio.com/2010-04-01/Accounts/{SID}"

inbound: dict = {"webhook": None, "note": "not set up yet"}  # shown in /sms/status


def configured() -> bool:
    return bool(SID and TOKEN and FROM)


def _call(path: str, params: dict | None = None, method: str = "GET") -> dict:
    url = API + path
    data = None
    if method == "GET" and params:
        url += "?" + urllib.parse.urlencode(params)
    elif params:
        data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={"Authorization": "Basic " + base64.b64encode(f"{SID}:{TOKEN}".encode()).decode()},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read())
            detail = f"{body.get('message', '')} (Twilio error {body.get('code', e.code)})"
        except Exception:
            detail = f"HTTP {e.code}"
        raise RuntimeError(f"Twilio: {detail}") from None


def send(to: str, body: str) -> str:
    """Text `body` to `to`; returns the message SID."""
    if not configured():
        raise RuntimeError("Twilio isn't set up: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER are needed.")
    return _call("/Messages.json", {"To": to, "From": FROM, "Body": body[:1600]}, "POST").get("sid", "")


def signature_ok(url: str, params: dict[str, str], signature: str) -> bool:
    """Twilio signs the full webhook URL followed by every POST field, sorted by name."""
    if not (TOKEN and signature):
        return False
    payload = url + "".join(k + params[k] for k in sorted(params))
    expected = base64.b64encode(hmac.new(TOKEN.encode(), payload.encode(), hashlib.sha1).digest()).decode()
    return hmac.compare_digest(expected, signature)


def point_webhook(public_url: str) -> None:
    """Send incoming texts for TWILIO_FROM_NUMBER to the shop at `public_url`."""
    url = public_url.rstrip("/") + WEBHOOK_PATH
    if inbound["webhook"] == url:
        return
    try:
        found = _call("/IncomingPhoneNumbers.json", {"PhoneNumber": FROM}).get("incoming_phone_numbers", [])
        if not found:
            inbound.update(webhook=None, note=(
                f"{FROM} isn't a number this Twilio account owns, so replies can't reach Nora. "
                "Get a number in the Twilio console and set TWILIO_FROM_NUMBER to it."
            ))
            log.warning(inbound["note"])
            return
        _call(f"/IncomingPhoneNumbers/{found[0]['sid']}.json", {"SmsUrl": url, "SmsMethod": "POST"}, "POST")
        inbound.update(webhook=url, note="incoming texts reach Nora")
        log.warning("Twilio sends texts to %s on to %s", FROM, url)
    except Exception as e:
        inbound.update(webhook=None, note=f"couldn't set the webhook: {e}")
        log.warning(inbound["note"])
