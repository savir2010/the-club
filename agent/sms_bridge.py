"""Live iMessage bridge: people text this Mac, and Nora answers as herself.

Run on the Mac that plays Nora (Messages signed in, Full Disk Access for the terminal):
    npm run nora-sms

Who can text: numbers in NORA_SMS_ALLOW, plus any number a member registers when they join on
the website (the "registered phone" that identifies them; no separate login). Every allowed
number shops as the demo member, and shares that member's cart with the website in real time.

What it reads: only messages that arrive after the bridge starts, only from allowed numbers, and
only in one-to-one threads (group chats are skipped). Nothing else in Messages is read.
Conversations and registrations live in memory only and are gone when the bridge stops.
"""
import asyncio
import json
import logging
import os
import re
import subprocess
from typing import Any, AsyncIterator, Callable
from urllib.parse import quote

import cart_store
import config
import shop
from imessage import CHAT_DB, SEND, _decode_body, _query

log = logging.getLogger("nora.sms")

ALLOW = [n.strip() for n in os.getenv("NORA_SMS_ALLOW", "").split(",") if n.strip()]
NORA_NUMBER = os.getenv("NORA_SMS_NUMBER", "").strip()  # shown on the site: "Text Nora at ..."
DRY_RUN = os.getenv("NORA_SMS_DRY_RUN", "") == "1"  # print replies instead of texting (for testing)
MAX_REPLIES = int(os.getenv("NORA_SMS_MAX_REPLIES", "60"))  # per bridge run; a runaway stops here
MAX_REGISTERED = 10
POLL_SECONDS = 1.5
TYPING_SECONDS = 1.0  # a short pause before each bubble so it reads like someone typing

SCRIPT = config.load("imessage-script.json")
SETTINGS = config.load("settings.json")
ADDRESSES = {a["id"]: a for a in config.load("member.json")["addresses"]}

TurnFn = Callable[..., AsyncIterator[str]]

state: dict[str, Any] = {
    "active": False, "since_rowid": 0, "replies": 0, "orders": 0, "error": None,
    "registered": [],  # phone numbers added from the website's join flow
    "public_url": os.getenv("NORA_PUBLIC_URL", "").rstrip("/"),  # links in texts; learned from the site if unset
    "threads": {},  # handle -> {"history": [...]}
    "outbox": [],   # dry run: what would have been texted
}
_task: asyncio.Task | None = None
_turn: TurnFn | None = None
_inbox: asyncio.Queue | None = None


def _digits(n: str) -> str:
    return re.sub(r"\D", "", n)[-10:]


def _allowed_list() -> list[str]:
    return [*ALLOW, *state["registered"]]


def _allowed(handle: str) -> bool:
    allow = _allowed_list()
    if "@" in handle:
        return handle.lower() in {a.lower() for a in allow}
    return len(_digits(handle)) == 10 and _digits(handle) in {_digits(a) for a in allow if "@" not in a}


def register(phone: str) -> dict:
    """A member gave this number when joining: let it text Nora as them."""
    d = _digits(phone)
    if len(d) != 10:
        raise ValueError("Enter a 10-digit US mobile number.")
    if d not in {_digits(a) for a in _allowed_list() if "@" not in a}:
        if len(state["registered"]) >= MAX_REGISTERED:
            state["registered"].pop(0)
        state["registered"].append(f"+1{d}")
        log.warning("registered %s to text Nora", f"+1{d}")
    return status()


def learn_public_url(origin: str) -> None:
    """The site tells us the address people reach it at, so links in texts open on a phone."""
    origin = origin.rstrip("/")
    if os.getenv("NORA_PUBLIC_URL") or not origin.startswith("https://"):
        return
    state["public_url"] = origin


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
    for a in _allowed_list():
        if "@" in a:
            clauses.append("h.id = ? COLLATE NOCASE")
            args.append(a)
        else:
            clauses.append("h.id LIKE ?")
            args.append(f"%{_digits(a)}")
    if not clauses:
        state["since_rowid"] = _latest_rowid()  # nobody to listen to yet; never look back later
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


def _picks_bubbles(picks: list[dict]) -> list[str]:
    """A numbered list, then (when the shop has a public address) one link per pick, alone in its
    own bubble so iMessage turns it into a preview card with the photo."""
    lines, links = [], []
    for i, pk in enumerate(picks, 1):
        p = shop.BY_ID.get(pk["id"])
        if p:
            lines.append(f"{i}. {p['name']} ({p['format']}), ${p['member_price']:.2f}. {pk['reason'].strip()}")
            if state["public_url"]:
                links.append(f"{state['public_url']}/shop/{p['id']}")
    return ["\n".join(lines), *links]


def _trimmed(history: list[dict], keep: int = 240) -> list[dict]:
    """Drop the oldest turns, cutting only where a new text from the person begins."""
    if len(history) <= keep:
        return history
    for i in range(len(history) - keep, len(history)):
        m = history[i]
        if m["role"] == "user" and isinstance(m["content"], str):
            return history[i:]
    return []


def _place_order(plan: dict) -> list[str]:
    cart = cart_store.lines()
    view = shop.cart_view(cart)
    total = shop.money(view["subtotal"] * (1 + SETTINGS["tax_rate"]))
    oid = f"CL-{20512 + state['orders']}"
    state["orders"] += 1
    day = plan.get("day") or "Today"
    window = plan.get("window") or SETTINGS["delivery_slots"][day][-1]
    where = ADDRESSES.get(plan.get("address") or "home", ADDRESSES["home"])
    n = view["item_count"]
    path = f"/orders/{oid}?window={quote(f'{day} {window}')}&to={quote(where['label'])}"
    cart_store.order_placed(
        {"id": oid, "items": n, "total": total, "day": day, "window": window, "to": where["label"], "path": path},
        source="sms",
    )
    first = (
        f"Order {oid} is placed: {n} item{'s' if n != 1 else ''}, ${total:.2f} with tax, free delivery. "
        f"Arriving {day.lower()} {window} at {where['label'].lower()}, {where['line'].split(',')[0]}."
    )
    second = f"{SCRIPT['driver']} will bring it and check your ID at the door."
    out = [first, second]
    if state["public_url"]:
        out.append(f"{state['public_url']}{path}")
    return out


class _Connected:
    """run_turn checks for a dropped browser; a text thread never drops."""
    async def is_disconnected(self) -> bool:
        return False


async def _reply(handle: str, text: str) -> None:
    from main import ChatRequest  # imported here: main imports this module

    thread = state["threads"].setdefault(handle, {"history": []})
    req = ChatRequest(
        history=_trimmed(thread["history"]),
        message=text[:2000], channel="phone", cart=cart_store.lines(), account="member",
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
            for b in _picks_bubbles(picks):
                await _say(handle, b)
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
            cart_store.apply(e["op"], e["id"], e.get("qty", 0), source="sms")  # the website sees it within a second
        elif t == "checkout" and e.get("pay"):
            order_plan = e
        elif t == "error":
            buf.clear()
            await _say(handle, e["message"])
        elif t == "done":
            await flush(final=True)
            thread["history"].extend(e["messages"])
    if order_plan and cart_store.lines():
        for line in _place_order(order_plan):
            await _say(handle, line)


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
    """Forget every conversation, registration and the cart (between rehearsals)."""
    state["threads"].clear()
    state["registered"].clear()
    state["replies"] = 0
    state["orders"] = 0  # every rehearsal starts at the same order number
    state["outbox"] = []
    cart_store.reset()
    return status()


def inject(handle: str, text: str) -> None:
    """Dry run only: pretend `handle` texted `text`."""
    if not DRY_RUN:
        raise RuntimeError("inject works only with NORA_SMS_DRY_RUN=1")
    if not _allowed(handle):
        raise RuntimeError(f"{handle} is not allowed to text Nora (not in NORA_SMS_ALLOW or registered)")
    if not state["active"]:
        raise RuntimeError("The bridge isn't running.")
    _inbox.put_nowait((handle, text))


def status() -> dict:
    return {
        "active": state["active"], "dry_run": DRY_RUN, "nora_number": NORA_NUMBER,
        "allow": ALLOW, "registered": state["registered"], "public_url": state["public_url"],
        "replies": state["replies"], "max_replies": MAX_REPLIES, "threads": len(state["threads"]),
        "orders": state["orders"], "error": state["error"], **({"outbox": state["outbox"]} if DRY_RUN else {}),
    }
