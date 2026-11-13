"""Scripted iMessages from Nora, sent through this Mac's Messages app.

Demo only. Texts go to one number (NORA_IMESSAGE_TO) and come from whichever Apple ID is
signed in to Messages. Replies are read from Messages' local database, limited to that one
number and to messages that arrive after the demo starts; nothing else is read.
Reading replies needs Full Disk Access for the terminal that runs the agent.
"""
import asyncio
import json
import logging
import os
import re
import sqlite3
import subprocess
from pathlib import Path

import config
import shop

log = logging.getLogger("nora.imessage")

TO = os.getenv("NORA_IMESSAGE_TO", "").strip()
CHAT_DB = Path.home() / "Library/Messages/chat.db"
SCRIPT = config.load("imessage-script.json")

# AppleScript gets the number and text as arguments, so nothing in the text can break out of the script.
SEND = '''
on run argv
  set target to item 1 of argv
  set body to item 2 of argv
  tell application "Messages"
    set svc to missing value
    repeat with a in accounts
      try
        if service type of a is iMessage and enabled of a then set svc to a
      end try
    end repeat
    if svc is missing value then error "No iMessage account is signed in to Messages."
    send body to participant target of svc
  end tell
end run
'''

MAX_AUTO_REPLIES = 3  # hard stop: the script never answers more than this many replies per run

state = {"active": False, "auto_replies": 0, "phase": "idle", "since_rowid": 0, "sent": [], "received": [], "error": None}
_task: asyncio.Task | None = None


def _digits(n: str) -> str:
    return re.sub(r"\D", "", n)[-10:]


def send_text(text: str) -> None:
    r = subprocess.run(["osascript", "-e", SEND, TO, text], capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip() or "Messages could not send the text.")
    state["sent"].append(text)


def _decode_body(blob: bytes | None) -> str:
    """Newer macOS keeps the text in attributedBody (an archived NSAttributedString)."""
    if not blob or b"NSString" not in blob:
        return ""
    b = blob.split(b"NSString", 1)[1][5:]
    if not b:
        return ""
    if b[0] == 0x81:
        n = int.from_bytes(b[1:3], "little")
        s = b[3 : 3 + n]
    else:
        s = b[1 : 1 + b[0]]
    return s.decode("utf-8", "ignore")


def _query(sql: str, args: tuple) -> list[tuple]:
    con = sqlite3.connect(f"file:{CHAT_DB}?mode=ro", uri=True)
    try:
        return con.execute(sql, args).fetchall()
    finally:
        con.close()


def _latest_rowid() -> int:
    return _query("SELECT IFNULL(MAX(ROWID), 0) FROM message", ())[0][0]


def _norm(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip().lower()


def _is_echo(msg: str) -> bool:
    """When the Mac and the phone share an Apple ID, Nora's own texts come back as incoming ones."""
    return _norm(msg) in {_norm(t) for t in state["sent"]}


def _new_replies() -> list[str]:
    """Incoming messages from the demo number only, newer than the last one seen."""
    rows = _query(
        """SELECT m.ROWID, m.text, m.attributedBody, h.id FROM message m
           JOIN handle h ON m.handle_id = h.ROWID
           WHERE m.ROWID > ? AND m.is_from_me = 0 AND h.id LIKE ? ORDER BY m.ROWID""",
        (state["since_rowid"], f"%{_digits(TO)}"),
    )
    out = []
    for rowid, text, body, handle in rows:
        state["since_rowid"] = max(state["since_rowid"], rowid)
        msg = (text or _decode_body(body)).strip()
        if msg and not _is_echo(msg):
            out.append(msg)
    return out


def _fill(lines: list[str], values: dict) -> list[str]:
    return [line.format(**values) for line in lines]


async def _say(lines: list[str]) -> None:
    for i, line in enumerate(lines):
        if i:
            await asyncio.sleep(SCRIPT["gap_seconds"])
        if not state["active"]:
            return
        await asyncio.to_thread(send_text, line)


def _is_yes(text: str) -> bool:
    t = re.sub(r"[^a-z ]", "", text.lower()).strip()
    return any(t == w or t.startswith(w + " ") for w in SCRIPT["yes_words"])


async def _watch(values: dict) -> None:
    try:
        deadline = asyncio.get_running_loop().time() + 20 * 60
        while state["active"] and asyncio.get_running_loop().time() < deadline:
            await asyncio.sleep(1.5)
            replies = await asyncio.to_thread(_new_replies)
            if not replies:
                continue
            state["received"].extend(replies)
            reply = replies[-1]  # several at once get one answer, never one each
            if state["auto_replies"] >= MAX_AUTO_REPLIES:
                state["active"] = False
                break
            state["auto_replies"] += 1
            if state["phase"] == "waiting" and _is_yes(reply):
                state["phase"] = "confirmed"
                await _say(_fill(SCRIPT["confirmed"], values))
            elif state["phase"] == "waiting":
                await _say(_fill(SCRIPT["other"], values))
            else:
                await _say(_fill(SCRIPT["after"], values))
                state["active"] = False  # one courtesy reply after the order, then stop listening
                break
            # skip anything that arrived while Nora was texting (her own echoes included)
            await asyncio.sleep(1.5)
            await asyncio.to_thread(_new_replies)
    except Exception as e:  # e.g. no Full Disk Access: sending still worked, replies can't be read
        log.exception("imessage watcher stopped")
        state["error"] = f"Can't read replies: {e}"
    finally:
        state["active"] = False


async def start(cart: list[shop.Line]) -> dict:
    global _task
    if not TO:
        raise RuntimeError("Set NORA_IMESSAGE_TO in .env.local to the phone that should get the texts.")
    stop()
    view = shop.cart_view(cart)
    count = sum(l["qty"] for l in cart)
    member = config.load("member.json")
    values = {
        "first": member["first"],
        "count": f"{count} item{'s' if count != 1 else ''}",
        "total": f"${view['subtotal']:.2f}",
        "order": SCRIPT["order"],
        "driver": SCRIPT["driver"],
        "eta": SCRIPT["eta"],
    }
    state.update(active=True, phase="waiting", sent=[], received=[], error=None, auto_replies=0)
    try:
        state["since_rowid"] = await asyncio.to_thread(_latest_rowid)
    except Exception as e:
        state["error"] = f"Can't read replies (give the terminal Full Disk Access): {e}"
    await _say(_fill(SCRIPT["start"], values))
    if state["error"] is None:
        _task = asyncio.create_task(_watch(values))
    return status()


def stop() -> None:
    global _task
    state["active"] = False
    if _task and not _task.done():
        _task.cancel()
    _task = None


def status() -> dict:
    return {"active": state["active"], "phase": state["phase"], "sent": len(state["sent"]), "replies": len(state["received"]), "error": state["error"]}
