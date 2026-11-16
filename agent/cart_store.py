"""The member's cart, shared by the website and the text thread.

The demo has one member account, so there is one cart. The website polls it; the SMS bridge
writes to it. Every change bumps a version and appends an event, so the site can show what
changed and where it came from ("Added by text: ..."). Memory only; restarting clears it.
"""
import time
from typing import Any

import shop

MAX_EVENTS = 200

state: dict[str, Any] = {"v": 0, "lines": [], "events": []}


def _event(source: str, kind: str, **data: Any) -> None:
    state["v"] += 1
    state["events"].append({"v": state["v"], "at": time.time(), "source": source, "kind": kind, **data})
    del state["events"][:-MAX_EVENTS]


def lines() -> list[dict]:
    return [dict(l) for l in state["lines"]]


def replace(new_lines: list[dict], source: str) -> int:
    """The website sends its whole cart after a change it made itself."""
    clean = [{"id": l["id"], "qty": int(l["qty"])} for l in new_lines if l.get("id") in shop.BY_ID and int(l.get("qty", 0)) > 0]
    if clean == state["lines"]:
        return state["v"]
    state["lines"] = clean
    _event(source, "sync")
    return state["v"]


def apply(op: str, pid: str, qty: int, source: str) -> None:
    """One change from Nora (add / set / remove), mirrored from her tool calls."""
    line = next((l for l in state["lines"] if l["id"] == pid), None)
    if op == "add":
        if line:
            line["qty"] += qty
        else:
            state["lines"].append({"id": pid, "qty": qty})
    elif op == "set" and line:
        line["qty"] = qty
    elif op == "remove" and line:
        state["lines"].remove(line)
    else:
        return
    _event(source, op, id=pid, qty=qty)


def order_placed(order: dict, source: str) -> None:
    state["lines"] = []
    _event(source, "order", order=order)


def since(v: int) -> dict:
    return {"v": state["v"], "lines": lines(), "events": [e for e in state["events"] if e["v"] > v]}


def reset() -> None:
    state["lines"] = []
    _event("system", "reset")
