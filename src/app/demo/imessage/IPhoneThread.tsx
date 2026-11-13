"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronLeft, Mic, Plus } from "lucide-react";
import { NoraAvatar } from "@/components/brand";
import { findProduct, money } from "@/lib/data";
import type { NoraEvent } from "@/lib/agent/events";

/*
 * A simulated iPhone Messages thread with Nora, for presenting and for recording a video.
 * The opener and the member's lines come from SCRIPT; every reply from Nora comes live from the
 * agent (channel "imessage"), and products she recommends arrive as link previews.
 * ?play=1 plays the script by itself; ?zoom=2 renders the phone at 2x for crisp video capture.
 * Without ?play you can type into the phone and talk to the real Nora.
 */

const SCRIPT = {
  opener: ["Hi Dana, it's Nora from The Club. Anything I can find for you today?"],
  member: ["Hey Nora! My back's been really sore after the gym this week. Anything that could help?", "The first one please"],
};

type Msg = { id: number; from: "me" | "nora"; text?: string; link?: string; status?: "Delivered" | "Read" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 0;

function StatusBar() {
  return (
    <div className="flex h-[54px] items-end justify-between px-[34px] pb-[10px] text-[17px] font-semibold tracking-[-0.02em] text-black">
      <span>9:41</span>
      <span className="flex items-center gap-[6px]" aria-hidden>
        <svg width="19" height="12" viewBox="0 0 19 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 5} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="0.8" fill="#000" />
          ))}
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 2.3c2.4 0 4.6.9 6.3 2.5l1.2-1.2C14 1.6 11.4.6 8.5.6S3 1.6 1 3.6l1.2 1.2C3.9 3.2 6.1 2.3 8.5 2.3zm0 3.4c1.5 0 2.9.6 4 1.6l1.2-1.2c-1.4-1.3-3.2-2.1-5.2-2.1s-3.8.8-5.2 2.1l1.2 1.2c1.1-1 2.5-1.6 4-1.6zm0 3.4c.6 0 1.2.2 1.6.6L8.5 11.3 6.9 9.7c.4-.4 1-.6 1.6-.6z" fill="#000" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="#000" strokeOpacity=".4" />
          <rect x="2" y="2" width="19" height="9" rx="2" fill="#000" />
          <path d="M24 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="#000" fillOpacity=".45" />
        </svg>
      </span>
    </div>
  );
}

function LinkPreview({ id }: { id: string }) {
  const p = findProduct(id);
  if (!p) return null;
  return (
    <a href={`/shop/${p.id}`} target="_blank" rel="noreferrer" className="block w-[252px] overflow-hidden rounded-[18px] bg-[#e9e9eb]">
      <span className="block aspect-[1.55] overflow-hidden bg-[#f2f2f4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image} alt="" className="size-full object-cover" />
      </span>
      <span className="block px-3.5 pt-2 pb-2.5">
        <span className="line-clamp-2 block text-[15px] leading-[1.25] font-semibold text-black">{p.name}</span>
        <span className="mt-0.5 block text-[13px] text-[#8a8a8e]">
          The Club · {money(p.member_price)} member price
        </span>
      </span>
    </a>
  );
}

export function IPhoneThread() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const history = useRef<unknown[]>([]);
  const cart = useRef<{ id: string; qty: number }[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const push = (m: Omit<Msg, "id">) => setMsgs((ms) => [...ms, { ...m, id: ++seq }]);
  const markLastMine = (status: Msg["status"]) =>
    setMsgs((ms) => {
      const i = ms.map((m) => m.from).lastIndexOf("me");
      return i < 0 ? ms : ms.map((m, j) => (j === i ? { ...m, status } : { ...m, status: undefined }));
    });

  /** Nora "types" each bubble before it lands, like a real thread. */
  async function noraSays(parts: Omit<Msg, "id" | "from">[]) {
    for (const part of parts) {
      setTyping(true);
      await sleep(part.link ? 700 : Math.min(1800, 500 + (part.text?.length ?? 0) * 14));
      setTyping(false);
      push({ from: "nora", ...part });
      await sleep(350);
    }
  }

  /** One message from the member to the real Nora; resolves when her reply has landed. */
  async function send(text: string) {
    const said = text.trim();
    if (!said || busy) return;
    setBusy(true);
    setDraft("");
    push({ from: "me", text: said, status: "Delivered" });
    await sleep(900);
    markLastMine("Read");
    setTyping(true);

    // Collect her reply: text per model step becomes bubbles; products become link previews.
    const parts: Omit<Msg, "id" | "from">[] = [];
    let buf = "";
    const flush = () => {
      for (const t of buf.split(/\n+/).map((x) => x.trim()).filter(Boolean)) parts.push({ text: t });
      buf = "";
    };
    try {
      const res = await fetch("/api/nora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: history.current, message: said, channel: "imessage", cart: cart.current }),
      });
      if (!res.ok || !res.body) throw new Error("Nora isn't connected. Start the agent with npm run agent.");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let line = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        line += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = line.indexOf("\n")) >= 0) {
          const raw = line.slice(0, nl).trim();
          line = line.slice(nl + 1);
          if (!raw) continue;
          const e = JSON.parse(raw) as NoraEvent;
          if (e.t === "turn") flush();
          else if (e.t === "text") buf += e.d;
          else if (e.t === "products") {
            flush();
            for (const pk of e.picks) parts.push({ link: pk.id });
          } else if (e.t === "cart") {
            const rest = cart.current.filter((l) => l.id !== e.id);
            cart.current = e.op === "remove" ? rest : [...rest, { id: e.id, qty: e.qty }];
          } else if (e.t === "done") history.current = [...history.current, ...e.messages];
          else if (e.t === "error") buf += `\n${e.message}`;
        }
      }
      flush();
      parts.sort((a, b) => Number(!!a.link) - Number(!!b.link));
    } catch (err) {
      parts.push({ text: (err as Error).message });
    }
    setTyping(false);
    await noraSays(parts);
    setBusy(false);
  }

  // Scripted run for the video: ?play=1
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setZoom(Number(q.get("zoom")) || 1);
    if (q.get("play") !== "1") {
      noraSays(SCRIPT.opener.map((text) => ({ text })));
      return;
    }
    let cancelled = false;
    (async () => {
      await sleep(1200);
      await noraSays(SCRIPT.opener.map((text) => ({ text })));
      for (const line of SCRIPT.member) {
        await sleep(1400);
        for (let i = 1; i <= line.length && !cancelled; i++) {
          setDraft(line.slice(0, i));
          await sleep(38);
        }
        await sleep(450);
        if (cancelled) return;
        await send(line);
      }
      await sleep(2500);
      (window as unknown as { __threadDone: boolean }).__threadDone = true;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center bg-[#e9e3d8] p-6">
      {/* iPhone */}
      <div style={{ zoom }} className="relative h-[844px] w-[390px] rounded-[58px] bg-[#111] p-[11px] shadow-[0_40px_80px_-30px_rgb(40_30_15/0.55),inset_0_0_0_2px_#3a3a3a]">
        <div className="relative flex size-full flex-col overflow-hidden rounded-[48px] bg-white font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Helvetica_Neue',sans-serif] antialiased">
          <div className="absolute top-[11px] left-1/2 z-20 h-[35px] w-[124px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
          <StatusBar />

          {/* Header */}
          <div className="relative flex flex-col items-center border-b border-black/10 bg-[#f7f7f7]/95 pt-1 pb-2 backdrop-blur">
            <span className="absolute top-3 left-3 flex items-center text-[17px] text-[#007aff]">
              <ChevronLeft size={30} strokeWidth={2.4} className="-mr-1" />
              <span className="grid h-[21px] min-w-[21px] place-items-center rounded-full bg-[#007aff] px-1.5 text-[13px] font-medium text-white">3</span>
            </span>
            <NoraAvatar size={52} />
            <span className="mt-1 flex items-center gap-0.5 text-[12px] text-black">
              Nora <ChevronLeft size={11} className="rotate-180 text-[#8a8a8e]" strokeWidth={2.5} />
            </span>
          </div>

          {/* Thread */}
          <div ref={scroller} className="flex-1 overflow-y-auto px-3 pt-3 pb-2 [scrollbar-width:none]">
            <p className="mb-3 text-center text-[11px] font-medium text-[#8a8a8e]">
              iMessage
              <br />
              <span className="font-normal">Today 9:41 AM</span>
            </p>
            {msgs.map((m, i) => {
              const next = msgs[i + 1];
              const tail = !next || next.from !== m.from;
              const mine = m.from === "me";
              return (
                <div key={m.id} className={`imsg-in flex flex-col ${mine ? "items-end" : "items-start"} ${tail ? "mb-2" : "mb-[3px]"}`}>
                  {m.link ? (
                    <LinkPreview id={m.link} />
                  ) : (
                    <p
                      className={`relative max-w-[76%] px-[13px] py-[7px] text-[17px] leading-[1.3] tracking-[-0.01em] ${
                        mine ? "rounded-[19px] bg-[#007aff] text-white" : "rounded-[19px] bg-[#e9e9eb] text-black"
                      } ${tail ? (mine ? "imsg-tail-me" : "imsg-tail-them") : ""}`}
                    >
                      {m.text}
                    </p>
                  )}
                  {mine && m.status && <span className="mt-0.5 mr-1 text-[11px] font-medium text-[#8a8a8e]">{m.status}</span>}
                </div>
              );
            })}
            {typing && (
              <div className="imsg-in mb-2 flex">
                <span className="imsg-tail-them relative flex h-[36px] items-center gap-[5px] rounded-[19px] bg-[#e9e9eb] px-[14px]" aria-label="Nora is typing">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="typing-dot size-[8px] rounded-full bg-[#8a8a8e]" style={{ animationDelay: `${d * 160}ms` }} />
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* Input bar */}
          <form
            className="flex items-end gap-2 px-3 pt-1.5 pb-[30px]"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[#e9e9eb] text-[#8a8a8e]" aria-hidden>
              <Plus size={20} strokeWidth={2.2} />
            </span>
            <span className="flex min-h-[36px] flex-1 items-center rounded-[18px] border border-[#c7c7cc] pr-1 pl-3.5">
              <label htmlFor="imsg" className="sr-only">Message Nora</label>
              <input
                id="imsg"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="iMessage"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-[17px] text-black outline-none placeholder:text-[#c4c4c6]"
              />
              {draft.trim() ? (
                <button className="grid size-[28px] place-items-center rounded-full bg-[#007aff] text-white" aria-label="Send" disabled={busy}>
                  <ArrowUp size={18} strokeWidth={2.6} />
                </button>
              ) : (
                <Mic size={20} className="mr-1.5 text-[#8a8a8e]" aria-hidden />
              )}
            </span>
          </form>
          <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
        </div>
      </div>
    </div>
  );
}
