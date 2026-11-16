"""Nora, the concierge agent: a FastAPI service that streams NDJSON events to the shop.

Run:  .venv/bin/uvicorn main:app --port 8100   (from this folder)
The Next.js route /api/nora proxies to POST /chat.
"""
import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Literal

import anthropic
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

import config
import imessage
import shop
import cart_store
import sms_bridge
import edge_tts

from prompt import CHAT_OPENED, REFUSAL_TEXT, STEPPED_AWAY, SYSTEM_PROMPT, TEXT_PREFIX, VOICE_PREFIX, IMESSAGE_PREFIX, PHONE_PREFIX
from tools import TOOLS, run_tool

log = logging.getLogger("nora")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # npm run nora-sms sets NORA_SMS_BRIDGE=1: start listening for texts as soon as the service is up.
    if os.getenv("NORA_SMS_BRIDGE") == "1":
        try:
            s = sms_bridge.start(run_turn)
            mode = "DRY RUN (printing, not texting)" if s["dry_run"] else "live"
            who = ", ".join(s["allow"]) or "numbers registered on the website"
            log.warning("Nora is listening for texts from %s [%s]", who, mode)
        except Exception as e:
            log.error("SMS bridge did not start: %s", e)
    yield
    sms_bridge.stop()


app = FastAPI(title="Nora concierge agent", lifespan=lifespan)
client = anthropic.AsyncAnthropic(api_key=config.API_KEY) if config.API_KEY else None

FALLBACK = {"betas": ["server-side-fallback-2026-07-01"], "fallbacks": "default"}


class CartLine(BaseModel):
    id: str
    qty: int = Field(ge=1, le=50)


class ChatRequest(BaseModel):
    history: list[dict[str, Any]] = Field(default_factory=list, max_length=300)
    message: str | None = Field(default=None, max_length=2000)
    action: Literal["start", "away"] | None = None
    channel: Literal["chat", "sms", "voice", "imessage", "phone"] = "chat"
    cart: list[CartLine] = Field(default_factory=list)
    # Who is shopping. Guests can browse, chat and fill a cart; only members check out, and only
    # members can have Nora place an order for them.
    account: Literal["guest", "member"] = "guest"


def line(event: dict) -> str:
    return json.dumps(event, ensure_ascii=False) + "\n"


async def run_turn(req: ChatRequest, request: Request) -> AsyncIterator[str]:
    if req.action == "start":
        user_text = CHAT_OPENED
    elif req.action == "away":
        user_text = STEPPED_AWAY
    elif req.channel == "sms":
        user_text = f"{TEXT_PREFIX} {(req.message or '').strip()}"
    elif req.channel == "imessage":
        user_text = f"{IMESSAGE_PREFIX} {(req.message or '').strip()}"
    elif req.channel == "phone":
        user_text = f"{PHONE_PREFIX} {(req.message or '').strip()}"
    elif req.channel == "voice":
        user_text = f"{VOICE_PREFIX} {(req.message or '').strip()}"
    else:
        user_text = (req.message or "").strip()
    user_text = f"[account: {req.account}] {user_text}"
    user_msg = {"role": "user", "content": user_text}
    cart: list[shop.Line] = [{"id": l.id, "qty": l.qty} for l in req.cart if l.id in shop.BY_ID]
    produced: list[dict] = [user_msg]  # everything new this turn; the app appends it to its history verbatim
    pending: list[dict] = []

    def emit(e: dict) -> None:
        pending.append(e)

    try:
        json_retries = 0
        step = 0
        while step < config.MAX_STEPS:
            if await request.is_disconnected():
                return
            yield line({"t": "turn"})
            try:
                async with client.beta.messages.stream(
                    model=config.MODEL,
                    max_tokens=16000,
                    system=SYSTEM_PROMPT,
                    tools=TOOLS,
                    messages=[*req.history, *produced],
                    output_config={"effort": config.EFFORT},
                    cache_control={"type": "ephemeral"},
                    **FALLBACK,
                ) as stream:
                    async for event in stream:
                        if event.type == "text":
                            yield line({"t": "text", "d": event.text})
                    message = await stream.get_final_message()
                json_retries = 0
            except ValueError:
                # Eager input streaming: a tool input the SDK could not parse at all. Re-issue the step (bounded).
                json_retries += 1
                if json_retries > 2:
                    raise
                continue
            step += 1

            if message.stop_reason == "refusal":
                yield line({"t": "text", "d": REFUSAL_TEXT})
                break

            tool_uses = [b for b in message.content if b.type == "tool_use"]
            if message.stop_reason == "max_tokens" and tool_uses:
                raise RuntimeError("tool input truncated at max_tokens")

            # Keep the assistant turn exactly as returned, thinking blocks included.
            produced.append({"role": "assistant", "content": [b.to_dict(mode="json") for b in message.content]})
            if message.stop_reason != "tool_use" or not tool_uses:
                break

            results = []
            for tu in tool_uses:
                out = run_tool(tu.name, tu.input, cart, emit, member=req.account == "member", phone=req.channel == "phone")
                results.append({"type": "tool_result", "tool_use_id": tu.id, "content": out.content, **({"is_error": True} if out.is_error else {})})
                for e in pending:
                    yield line(e)
                pending.clear()
            # All results for one assistant turn go back in a single user message.
            produced.append({"role": "user", "content": results})

            # Setting the reply chips is the last act of a turn: once Nora has spoken, stop here
            # (the tool results stay in the transcript, so the next turn continues cleanly).
            spoke = any(
                b.get("type") == "text" and b.get("text", "").strip()
                for m in produced if m["role"] == "assistant" for b in m["content"]
            )
            if spoke and all(tu.name == "suggest_replies" for tu in tool_uses):
                break

        yield line({"t": "done", "messages": produced})
    except anthropic.AuthenticationError:
        yield line({"t": "error", "message": "The concierge isn't connected: the API key was rejected."})
    except anthropic.RateLimitError:
        yield line({"t": "error", "message": "The concierge is busy right now. Try again in a moment."})
    except anthropic.APIConnectionError:
        yield line({"t": "error", "message": "The concierge couldn't reach the model. Check the connection and try again."})
    except anthropic.APIStatusError as e:
        log.error("anthropic api error %s: %s", e.status_code, e.message)
        yield line({"t": "error", "message": "Sorry, I lost my train of thought. Try that again?"})
    except Exception:
        log.exception("agent turn failed")
        yield line({"t": "error", "message": "Sorry, something went wrong on my side. Try that again?"})


class SpeakRequest(BaseModel):
    text: str = Field(min_length=1, max_length=800)


@app.post("/tts")
async def tts(req: SpeakRequest):
    """One sentence of Nora's reply as MP3, streamed while it is generated."""
    async def audio() -> AsyncIterator[bytes]:
        # The free voice service now and then answers with no audio; try again before giving up.
        for attempt in range(3):
            sent = False
            try:
                async for chunk in edge_tts.Communicate(req.text, config.TTS_VOICE, rate=config.TTS_RATE).stream():
                    if chunk["type"] == "audio":
                        sent = True
                        yield chunk["data"]
                return
            except Exception as e:
                log.warning("tts attempt %d failed for %r: %s", attempt + 1, req.text[:80], e)
                if sent:
                    return

    return StreamingResponse(audio(), media_type="audio/mpeg", headers={"Cache-Control": "no-store"})


class IMessageStart(BaseModel):
    cart: list[CartLine] = Field(default_factory=list)


@app.post("/imessage/start")
async def imessage_start(req: IMessageStart):
    """Scripted demo: Nora texts the demo phone over iMessage, then waits for YES."""
    cart: list[shop.Line] = [{"id": l.id, "qty": l.qty} for l in req.cart if l.id in shop.BY_ID]
    try:
        return await imessage.start(cart)
    except Exception as e:
        log.warning("imessage start failed: %s", e)
        return JSONResponse({"message": str(e)}, status_code=500)


@app.get("/imessage/status")
async def imessage_status():
    return imessage.status()


@app.post("/imessage/stop")
async def imessage_stop():
    imessage.stop()
    return imessage.status()


@app.get("/sms/status")
async def sms_status():
    return sms_bridge.status()


@app.post("/sms/start")
async def sms_start():
    if client is None:
        return JSONResponse({"message": "No API key."}, status_code=503)
    try:
        return sms_bridge.start(run_turn)
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=400)


@app.post("/sms/stop")
async def sms_stop():
    """Kill switch: Nora stops reading and answering texts immediately."""
    sms_bridge.stop()
    return sms_bridge.status()


@app.post("/sms/reset")
async def sms_reset():
    """Forget every text conversation and cart (between rehearsals)."""
    return sms_bridge.reset()


class SmsRegister(BaseModel):
    phone: str = Field(min_length=7, max_length=30)


@app.post("/sms/register")
async def sms_register(req: SmsRegister):
    """The join flow registers the member's mobile so they can text Nora (no separate login)."""
    try:
        s = sms_bridge.register(req.phone)
        return {"ok": True, "nora_number": s["nora_number"], "texting": s["active"]}
    except ValueError as e:
        return JSONResponse({"message": str(e)}, status_code=400)


@app.get("/sms/info")
async def sms_info():
    """What the website shows: whether texting is live, and Nora's number."""
    s = sms_bridge.status()
    return {"texting": s["active"], "nora_number": s["nora_number"]}


class CartPut(BaseModel):
    lines: list[CartLine] = Field(default_factory=list, max_length=60)


@app.get("/cart")
async def cart_get(request: Request, since: int = 0):
    """The member's shared cart. The site polls this so changes made by text appear right away."""
    origin = request.headers.get("x-club-origin")
    if origin:
        sms_bridge.learn_public_url(origin)
    return cart_store.since(since)


@app.put("/cart")
async def cart_put(req: CartPut):
    """The site's own changes (adds, quantity, Nora in the web chat)."""
    v = cart_store.replace([l.model_dump() for l in req.lines], source="web")
    return {"v": v}


class SmsInject(BaseModel):
    handle: str = Field(min_length=3, max_length=100)
    text: str = Field(min_length=1, max_length=2000)


@app.post("/sms/inject")
async def sms_inject(req: SmsInject):
    """Dry run only (NORA_SMS_DRY_RUN=1): pretend an allowed number texted Nora."""
    try:
        sms_bridge.inject(req.handle, req.text)
        return {"ok": True}
    except Exception as e:
        return JSONResponse({"message": str(e)}, status_code=400)


@app.get("/health")
async def health():
    return {"ok": True, "model": config.MODEL, "connected": client is not None}


@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    if client is None:
        return JSONResponse({"message": "The concierge has no API key. Set ANTHROPIC_API_KEY (or ANTHROPIC_KEY) in .env."}, status_code=503)
    if not req.action and not (req.message or "").strip():
        return JSONResponse({"message": "Send a message or an action."}, status_code=400)
    return StreamingResponse(
        run_turn(req, request),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=config.PORT)
