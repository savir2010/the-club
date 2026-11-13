"""Live iMessage bridge: people text this Mac, and Nora answers as herself.

Run on the Mac that plays Nora (Messages signed in, Full Disk Access for the terminal):
    npm run nora-sms

What it reads: only messages that arrive after the bridge starts, only from the numbers in
NORA_SMS_ALLOW, and only in one-to-one threads (group chats are skipped). Nothing else in
Messages is read. Conversations live in memory only and are gone when the bridge stops.
"""
import asyncio
import json
import logging
import os
import re
import subprocess
from typing import Any, AsyncIterator, Callable

import config
import shop
from imessage import CHAT_DB, SEND, _decode_body, _query

log = logging.getLogger("nora.sms")

ALLOW = [n.strip() for n in os.getenv("NORA_SMS_ALLOW", "").split(",") if n.strip()]
DRY_RUN = os.getenv("NORA_SMS_DRY_RUN", "") == "1"  # print replies instead of texting (for testing)
MAX_REPLIES = int(os.getenv("NORA_SMS_MAX_REPLIES", "40"))  # per bridge run; a runaway stops here
PUBLIC_URL = os.getenv("NORA_PUBLIC_URL", "").rstrip("/")  # optional shop URL for a tracking link
POLL_SECONDS = 1.5
TYPING_SECONDS = 1.0  # a short pause before each bubble so it reads like someone typing

SCRIPT = config.load("imessage-script.json")
SETTINGS = config.load("settings.json")
ADDRESSES = {a["id"]: a for a in config.load("member.json")["addresses"]}

TurnFn = Callable[..., AsyncIterator[str]]

state: dict[str, Any] = {
    "active": False, "since_rowid": 0, "replies": 0, "orders": 0, "error": None,
    "threads": {},  # handle -> {"history": [...], "cart": [...]}
    "outbox": [],   # dry run: what would have been texted
}
_task: asyncio.Task | None = None
_turn: TurnFn | None = None
_inbox: asyncio.Queue | None = None


def _digits(n: str) -> str:
    return re.sub(r"\D", "", n)[-10:]


def _allowed(handle: str) -> bool:
    if "@" in handle:
        return handle.lower() in {a.lower() for a in ALLOW}
    return _digits(handle) in {_digits(a) for a in ALLOW if "@" not in a}


def _send(handle: str, text: str) -> None:
    text = text.strip()
    if not text:
        return
    if DRY_RUN:
        state["outbox"].append({"to": handle, "text": text})
        log.info("[dry run] to %s: %s", handle, text)
        return
    r = subprocess.run(["osascript", "-e", SEND, handle, text], capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip() or "Messages could not send the text.")


async def _say(handle: str, text: str) -> None:
    if not text.strip():
        return
    await asyncio.sleep(TYPING_SECONDS)
    await asyncio.to_thread(_send, handle, text)


def _latest_rowid() -> int:
    return _query("SELECT IFNULL(MAX(ROWID), 0) FROM message", ())[0][0]


def _new_messages() -> list[tuple[str, str]]:
    """(handle, text) for new incoming one-to-one messages from allowed senders only."""
    clauses, args = [], [state["since_rowid"]]
    for a in ALLOW:
        if "@" in a:
            clauses.append("h.id = ? COLLATE NOCASE")
            args.append(a)
        else:
            clauses.append("h.id LIKE ?")
            args.append(f"%{_digits(a)}")
    if not clauses:
        return []
    rows = _query(
        f"""SELECT m.ROWID, m.text, m.attributedBody, h.id FROM message m
            JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.ROWID > ? AND m.is_from_me = 0 AND m.cache_roomnames IS NULL
              AND ({' OR '.join(clauses)})
            ORDER BY m.ROWID""",
        tuple(args),
    )
    out = []
    for rowid, text, body, handle in rows:
        state["since_rowid"] = max(state["since_rowid"], rowid)
        msg = (text or _decode_body(body)).strip()
        if msg and _allowed(handle):
            out.append((handle, msg))
    return out


def _picks_text(picks: list[dict]) -> str:
    lines = []
    for i, pk in enumerate(picks, 1):
        p = shop.BY_ID.get(pk["id"])
        if p:
            lines.append(f"{i}. {p['name']} ({p['format']}), ${p['member_price']:.2f}. {pk['reason'].strip()}")
    return "\n".join(lines)


def _apply_cart(cart: list[dict], e: dict) -> None:
    line = next((l for l in cart if l["id"] == e["id"]), None)
    if e["op"] == "add":
        if line:
            line["qty"] += e["qty"]
        else:
            cart.append({"id": e["id"], "qty": e["qty"]})
    elif e["op"] == "remove" and line:
        cart.remove(line)
    elif e["op"] == "set" and line:
        line["qty"] = e["qty"]


def _confirmation(cart: list[dict], plan: dict) -> tuple[str, str]:
    view = shop.cart_view(cart)
    total = shop.money(view["subtotal"] * (1 + SETTINGS["tax_rate"]))
    order = f"CL-{20512 + state['orders']}"
    state["orders"] += 1
    day = plan.get("day") or "Today"
    window = plan.get("window") or SETTINGS["delivery_slots"][day][-1]
    where = ADDRESSES.get(plan.get("address") or "home", ADDRESSES["home"])
    n = view["item_count"]
    first = (
        f"Order {order} is placed: {n} item{'s' if n != 1 else ''}, ${total:.2f} with tax, free delivery. "
        f"Arriving {day.lower()} {window} at {where['label'].lower()}, {where['line'].split(',')[0]}."
    )
    second = f"{SCRIPT['driver']} will bring it and check your ID at the door."
    if PUBLIC_URL:
        from urllib.parse import quote
        second += f" Track it here: {PUBLIC_URL}/orders/{order}?window={quote(f'{day} {window}')}&to={quote(where['label'])}"
    return first, second


def _trimmed(history: list[dict], keep: int = 240) -> list[dict]:
    """Drop the oldest turns, cutting only where a new text from the person begins."""
    if len(history) <= keep:
        return history
    for i in range(len(history) - keep, len(history)):
        m = history[i]
        if m["role"] == "user" and isinstance(m["content"], str):
            return history[i:]
    return []


class _Connected:
    """run_turn checks for a dropped browser; a text thread never drops."""
    async def is_disconnected(self) -> bool:
        return False


async def _reply(handle: str, text: str) -> None:
    from main import ChatRequest  # imported here: main imports this module

    thread = state["threads"].setdefault(handle, {"history": [], "cart": []})
    req = ChatRequest(
        history=_trimmed(thread["history"]),
        message=text[:2000], channel="phone", cart=thread["cart"], account="member",
    )
    buf: list[str] = []
    picks: list[dict] = []  # sent right after Nora's next line, so the list follows her intro
    order_plan: dict | None = None

    async def flush(final: bool = False) -> None:
        chunk = "".join(buf).strip()
        buf.clear()
        if chunk:
            await _say(handle, chunk)
        if picks and (chunk or final):
            await _say(handle, _picks_text(picks))
            picks.clear()

    async for raw in _turn(req, _Connected()):
        e = json.loads(raw)
        t = e.get("t")
        if t == "text":
            buf.append(e["d"])
        elif t == "turn":
            await flush()
        elif t == "products":
            await flush()
            picks[:] = e["picks"]
        elif t == "cart":
            _apply_cart(thread["cart"], e)
        elif t == "checkout" and e.get("pay"):
            order_plan = e
        elif t == "error":
            buf.clear()
            await _say(handle, e["message"])
        elif t == "done":
            await flush(final=True)
            thread["history"].extend(e["messages"])
    if order_plan and thread["cart"]:
        for line in _confirmation(thread["cart"], order_plan):
            await _say(handle, line)
        thread["cart"].clear()


async def _handle(handle: str, texts: list[str]) -> None:
    if state["replies"] >= MAX_REPLIES:
        if state["active"]:
            await _say(handle, "I'm going to pause here for now. Thanks for chatting with me!")
        state["active"] = False
        return
    state["replies"] += 1
    await _reply(handle, "\n".join(texts))


async def _loop() -> None:
    try:
        while state["active"]:
            batch: dict[str, list[str]] = {}
            if not DRY_RUN:
                for handle, msg in await asyncio.to_thread(_new_messages):
                    batch.setdefault(handle, []).append(msg)
            while _inbox and not _inbox.empty():
                handle, msg = _inbox.get_nowait()
                batch.setdefault(handle, []).append(msg)
            # Several texts that arrive while Nora is thinking get one answer, not one each.
            for handle, texts in batch.items():
                log.info("from %s: %s", handle, " / ".join(texts))
                try:
                    await _handle(handle, texts)
                except Exception as ex:
                    log.exception("reply failed")
                    state["error"] = str(ex)
            await asyncio.sleep(POLL_SECONDS)
    except asyncio.CancelledError:
        pass
    except Exception as ex:
        log.exception("sms bridge stopped")
        state["error"] = str(ex)
    finally:
        state["active"] = False


def start(turn: TurnFn) -> dict:
    """Begin listening. Only messages newer than this moment are ever read."""
    global _task, _turn, _inbox
    if not ALLOW:
        raise RuntimeError("Set NORA_SMS_ALLOW in .env.local to the number(s) that may text Nora, e.g. +14085550123.")
    stop()
    _turn = turn
    _inbox = asyncio.Queue()
    state.update(active=True, replies=0, error=None, outbox=[])
    if not DRY_RUN:
        try:
            state["since_rowid"] = _latest_rowid()
        except Exception as ex:
            state["active"] = False
            raise RuntimeError(
                f"Can't read {CHAT_DB}. Give your terminal app Full Disk Access "
                f"(System Settings > Privacy & Security > Full Disk Access), then restart it. ({ex})"
            )
    _task = asyncio.create_task(_loop())
    return status()


def stop() -> None:
    global _task
    state["active"] = False
    if _task and not _task.done():
        _task.cancel()
    _task = None


def reset() -> dict:
    """Forget every conversation and cart (between rehearsals)."""
    state["threads"].clear()
    state["replies"] = 0
    state["outbox"] = []
    return status()


def inject(handle: str, text: str) -> None:
    """Dry run only: pretend `handle` texted `text`."""
    if not DRY_RUN:
        raise RuntimeError("inject works only with NORA_SMS_DRY_RUN=1")
    if not _allowed(handle):
        raise RuntimeError(f"{handle} is not in NORA_SMS_ALLOW")
    _inbox.put_nowait((handle, text))


def status() -> dict:
    return {
        "active": state["active"], "dry_run": DRY_RUN, "allow": ALLOW, "replies": state["replies"],
        "max_replies": MAX_REPLIES, "threads": len(state["threads"]), "orders": state["orders"],
        "error": state["error"], **({"outbox": state["outbox"]} if DRY_RUN else {}),
    }
