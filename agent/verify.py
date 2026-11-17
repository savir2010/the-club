"""Reading an ID or medical card photo at sign-up.

Claude reads what is printed on the card (OCR and understanding in one step) and reports it as
structured JSON. Plain code then decides: does the name match, does the date of birth match, is the
member old enough, has the card expired. The model never decides who passes.

The photo is used for this one request only: it is not saved or logged.
"""
import base64
import json
import re
from datetime import date
from typing import Any, Literal

import config

MAX_BYTES = 6 * 1024 * 1024
MEDIA = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ID_KINDS = {"drivers_license", "state_id", "passport"}

# Structured output: the reply is JSON that matches this schema. Empty string means "not readable".
READ_SCHEMA = {
    "type": "object",
    "properties": {
        "readable": {"type": "boolean"},
        "document_kind": {
            "type": "string",
            "enum": ["drivers_license", "state_id", "passport", "medical_marijuana_card", "other", "not_a_document"],
        },
        "full_name": {"type": "string"},
        "date_of_birth": {"type": "string"},
        "expiration_date": {"type": "string"},
        "document_number": {"type": "string"},
        "issuer": {"type": "string"},
        "marked_sample": {"type": "boolean"},
    },
    "required": ["readable", "document_kind", "full_name", "date_of_birth", "expiration_date", "document_number", "issuer", "marked_sample"],
    "additionalProperties": False,
}

INSTRUCTIONS = (
    "Report what is printed on the document in this photo, as JSON.\n"
    "- readable: false if the photo is too blurry, dark or cropped to read the key fields.\n"
    "- full_name: the holder's name in natural order (first, middle, last).\n"
    "- date_of_birth, expiration_date: YYYY-MM-DD.\n"
    "- issuer: issuing state, country or agency.\n"
    "- marked_sample: true if the card says SAMPLE, SPECIMEN or similar.\n"
    "Copy values as printed. Use an empty string for anything you can't read clearly. Never guess a value."
)


def _image_block(data_url: str) -> dict:
    m = re.match(r"data:(image/[\w.+-]+);base64,(.+)", data_url, re.S)
    if not m or m[1] not in MEDIA:
        raise ValueError("Send a JPEG, PNG or WebP photo.")
    if len(m[2]) * 3 // 4 > MAX_BYTES:
        raise ValueError("That photo is too large. Try a smaller one.")
    base64.b64decode(m[2], validate=True)
    return {"type": "image", "source": {"type": "base64", "media_type": m[1], "data": m[2]}}


async def read_document(client: Any, data_url: str, kind: Literal["id", "medical"]) -> dict:
    what = "a government photo ID (driver's license, state ID or passport)" if kind == "id" else "an Arizona medical marijuana card"
    resp = await client.messages.create(
        model=config.MODEL,
        max_tokens=2048,
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": READ_SCHEMA}},
        messages=[{
            "role": "user",
            "content": [
                _image_block(data_url),
                {"type": "text", "text": f"This photo should be {what}.\n{INSTRUCTIONS}"},
            ],
        }],
    )
    if resp.stop_reason == "refusal":
        raise RuntimeError("The card couldn't be read. Try another photo.")
    text = next((b.text for b in resp.content if b.type == "text"), "")
    read = json.loads(text)
    return {k: (v if v != "" else None) for k, v in read.items()}


# ------------------------------------------------------------------ checks (plain code)

def _tokens(name: str | None) -> list[str]:
    if not name:
        return []
    if "," in name:  # "WHITFIELD, DANA M" -> "DANA M WHITFIELD"
        last, _, rest = name.partition(",")
        name = f"{rest} {last}"
    return [t for t in re.sub(r"[^a-z\s'-]", " ", name.lower()).replace("-", " ").split() if t]


def names_match(entered: str, printed: str | None) -> bool:
    """First and last name must both appear on the card; middle names and order don't matter."""
    want, have = _tokens(entered), set(_tokens(printed))
    if len(want) < 2 or not have:
        return bool(want) and want[0] in have
    return want[0] in have and want[-1] in have


def _date(s: str | None) -> date | None:
    try:
        return date.fromisoformat(s) if s else None
    except ValueError:
        return None


def _age(dob: date, today: date) -> int:
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _pretty(d: date | None) -> str:
    return d.strftime("%B %-d, %Y") if d else "Not readable"


def _last4(n: str | None) -> str:
    digits = re.sub(r"\W", "", n or "")
    return f"••••{digits[-4:]}" if len(digits) >= 4 else "Not readable"


def check_id(read: dict, name: str, dob: str, today: date | None = None) -> dict:
    today = today or date.today()
    problems: list[str] = []
    printed_dob, expires = _date(read.get("date_of_birth")), _date(read.get("expiration_date"))
    if not read.get("readable") or read.get("document_kind") == "not_a_document":
        problems.append("We couldn't read an ID in that photo. Try again flat, in good light, with all four corners showing.")
    elif read.get("document_kind") not in ID_KINDS:
        problems.append("That doesn't look like a driver's license, state ID or passport.")
    else:
        if not names_match(name, read.get("full_name")):
            problems.append(f"The name on the ID ({read.get('full_name') or 'not readable'}) doesn't match {name}.")
        if not printed_dob:
            problems.append("We couldn't read the date of birth.")
        elif _date(dob) and printed_dob != _date(dob):
            problems.append(f"The date of birth on the ID ({_pretty(printed_dob)}) doesn't match the one you entered.")
        if expires and expires < today:
            problems.append(f"This ID expired on {_pretty(expires)}.")
    age = _age(printed_dob, today) if printed_dob else None
    if age is not None and age < 21:
        problems.append(f"The ID shows you're {age}. Members must be 21 or older.")
    return {
        "ok": not problems,
        "problems": problems,
        "under_21": age is not None and age < 21,
        "fields": {
            "name": read.get("full_name"), "date_of_birth": _pretty(printed_dob),
            "age": age, "number": _last4(read.get("document_number")), "expires": _pretty(expires),
            "issuer": read.get("issuer"), "marked_sample": bool(read.get("marked_sample")),
        },
    }


def check_medical(read: dict, name: str, today: date | None = None) -> dict:
    today = today or date.today()
    problems: list[str] = []
    expires = _date(read.get("expiration_date"))
    if not read.get("readable") or read.get("document_kind") == "not_a_document":
        problems.append("We couldn't read a card in that photo. Try again flat, in good light.")
    elif read.get("document_kind") != "medical_marijuana_card":
        problems.append("That doesn't look like a medical marijuana card.")
    else:
        if not names_match(name, read.get("full_name")):
            problems.append(f"The name on the card ({read.get('full_name') or 'not readable'}) doesn't match your ID ({name}).")
        if expires and expires < today:
            problems.append(f"This card expired on {_pretty(expires)}.")
    return {
        "ok": not problems,
        "problems": problems,
        "fields": {
            "name": read.get("full_name"), "number": _last4(read.get("document_number")),
            "expires": _pretty(expires), "issuer": read.get("issuer"), "marked_sample": bool(read.get("marked_sample")),
        },
    }
