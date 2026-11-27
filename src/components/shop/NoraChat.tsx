"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, Check, Mic, Minus, RotateCcw } from "lucide-react";
import { CallRepButton } from "@/components/CallRepButton";
import { sentenceSplitter, useVoice } from "./voice";
import { MEMBER, PERSONA, bundleFor, byId, money } from "@/lib/data";
import type { NoraEvent, Pick } from "@/lib/agent/events";
import { NoraAvatar } from "@/components/brand";
import { ProductArt } from "@/components/ProductArt";
import { ProductPrice } from "./Price";
import { useShop } from "./ShopState";
import { useSession } from "@/lib/session";
import { bumpCart, flyToCart, press, reducedMotion, sleep } from "./motion";
import { useNoraPointer } from "@/components/NoraPointer";

type CheckoutPlan = Omit<Extract<NoraEvent, { t: "checkout" }>, "t">;


type Part = { k: "text"; text: string } | { k: "products"; picks: Pick[] } | { k: "status"; id: string; text: string };
type UiMsg = { from: "member"; text: string } | { from: "nora"; parts: Part[] };

/** Strips the odd bit of markdown the model may still send; the window shows plain text. */
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "");

/* ---------------------------------------------------------------- cards */

function PickCard({ id, reason }: { id: string; reason: string }) {
  const { lines, add } = useShop();
  const p = byId(id);
  const inCart = lines.some((l) => l.id === id);
  const b = bundleFor(p);
  return (
    <article data-pick-card={p.id} className="grid grid-cols-[64px_1fr] gap-3 rounded-none border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-2.5">
      <Link data-pick-art={p.id} href={`/shop/${p.id}`} className="aspect-square overflow-hidden rounded-none" aria-label={`View ${p.name}`}>
        <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
      </Link>
      <div className="min-w-0">
        <Link href={`/shop/${p.id}`} className="block text-[14px] font-medium leading-snug hover:underline">
          {p.name}
        </Link>
        <p className="text-[12px] text-[var(--color-muted)]">
          {p.brand} · {p.strain_type} · {p.potency.split(" · ")[0]} · {p.format}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-[var(--color-ivory)]/85">{reason}</p>
        {!p.in_stock && <p className="mt-1 text-[12px] font-medium text-[var(--color-clay)]">Out of stock</p>}
        <div className="mt-2 flex items-end justify-between gap-2">
          <ProductPrice p={p} size={15} />
          {inCart ? (
            <span className="inline-flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
              <Check size={14} className="text-[var(--color-brass)]" aria-hidden /> In cart
            </span>
          ) : p.in_stock ? (
            <button
              data-pick-add={p.id}
              className="btn btn-sm btn-outline h-8"
              onClick={(e) => {
                const art = e.currentTarget.closest("article")?.querySelector("[data-pick-art]") ?? null;
                flyToCart(art).then(() => add(p.id, 1, false));
              }}
              aria-label={`Add ${p.name} to cart`}
            >
              Add
            </button>
          ) : null}
        </div>
        {b && <p className="mt-1.5 text-[12px] text-[var(--color-brass)]">Bundle: {b.min_qty} or more at {money(b.price_each)} each</p>}
      </div>
    </article>
  );
}

function StatusLine({ id, text }: { id: string; text: string }) {
  const p = byId(id);
  return (
    <p className="chat-part mt-2 flex items-center gap-2.5 text-[13px] text-[var(--color-muted)]">
      <span data-status-art={id} className="size-8 shrink-0 overflow-hidden rounded-none border border-[var(--color-hairline)]">
        <ProductArt category={p.category} brand={p.brand} image={p.image} className="size-full" />
      </span>
      <Check size={14} className="shrink-0 text-[var(--color-brass)]" aria-hidden />
      {text}
    </p>
  );
}

/* ---------------------------------------------------------------- window */

export function NoraChat() {
  const { chatOpen, setChatOpen, lines, add, setQty, remove, setCartOpen } = useShop();
  const router = useRouter();
  const session = useSession();
  const memberRef = useRef(session.member);
  memberRef.current = session.member;
  const end = useRef<HTMLLIElement>(null);
  const panel = useRef<HTMLElement>(null);
  const sendBtn = useRef<HTMLButtonElement>(null);

  // Everything said in this window comes from the agent; nothing is scripted here.
  const [msgs, setMsgs] = useState<UiMsg[]>([]);
  const history = useRef<unknown[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const started = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const linesRef = useRef(lines);
  // Voice mode: the member talks, Nora answers out loud and then listens again.
  const [voiceMode, setVoiceMode] = useState(false);
  const voiceOn = useRef(false);
  // Nora's own cursor, for the clicks she makes on the member's behalf
  const pointer = useNoraPointer(() => {
    const s = sendBtn.current?.getBoundingClientRect();
    return s ? { x: s.left - 160, y: s.top - 40 } : { x: window.innerWidth - 200, y: window.innerHeight - 160 };
  });
  const sendRef = useRef<(input: { message: string; channel?: "chat" | "voice" }) => void>(() => {});
  const voice = useVoice({
    onInterim: (t) => setDraft(t),
    onFinal: (t) => sendRef.current({ message: t, channel: "voice" }),
  });
  linesRef.current = lines;

  // keep the window mounted for its exit animation
  const [mounted, setMounted] = useState(chatOpen);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (chatOpen) {
      setMounted(true);
      setLeaving(false);
    } else if (mounted) {
      setLeaving(true);
      const id = setTimeout(() => {
        setMounted(false);
        setLeaving(false);
      }, 220);
      return () => clearTimeout(id);
    }
  }, [chatOpen, mounted]);

  useEffect(() => {
    if (chatOpen) end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chatOpen, mounted, msgs]);

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setChatOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen, setChatOpen]);

  useEffect(() => () => abort.current?.abort(), []);

  /** Edits the Nora message currently being written (always the last one while streaming). */
  const patchNora = useCallback((fn: (parts: Part[]) => Part[]) => {
    setMsgs((ms) => {
      const last = ms[ms.length - 1];
      if (last?.from !== "nora") return ms;
      return [...ms.slice(0, -1), { ...last, parts: fn(last.parts) }];
    });
  }, []);

  /** One turn with the agent: a typed message, or an action (opening the chat, asking for a person). */
  async function send(input: { message: string; channel?: "chat" | "voice" } | { action: "start" }) {
    const said = "message" in input ? input.message.trim() : "";
    if (busy || ("message" in input && !said)) return;
    setBusy(true);
    setDraft("");
    setChips([]);
    setMsgs((m) => [...m, ...(said ? [{ from: "member" as const, text: said }] : []), { from: "nora", parts: [] }]);

    // Animations run one after another, in the order the agent acted.
    let queue = Promise.resolve();
    const later = (fn: () => Promise<void> | void) => {
      queue = queue.then(fn).catch(() => {});
    };
    let newPara = true;
    let checkout = null as CheckoutPlan | null; // assigned inside handle()
    let finished: unknown[] | null = null;
    let nextChips: string[] = [];
    // In voice mode each finished sentence is spoken while the rest is still streaming in.
    const speak = voiceOn.current;
    const split = sentenceSplitter();
    let spoke = false;
    let lastAction = ""; // spoken if Nora acts without saying anything

    const handle = (e: NoraEvent) => {
      switch (e.t) {
        case "turn":
          newPara = true;
          if (speak) voice.say(split.flush());
          break;
        case "text":
          if (speak) {
            if (e.d.trim()) spoke = true;
            split.push(e.d).forEach(voice.say);
          }
          patchNora((parts) => {
            const last = parts[parts.length - 1];
            if (!newPara && last?.k === "text") return [...parts.slice(0, -1), { k: "text", text: last.text + e.d }];
            return [...parts, { k: "text", text: e.d.trimStart() }];
          });
          newPara = false;
          break;
        case "products":
          patchNora((parts) => [...parts, { k: "products", picks: e.picks }]);
          newPara = true;
          break;
        case "cart": {
          const name = byId(e.id).name;
          const label = e.op === "add" ? `Added ${name}${e.qty > 1 ? ` × ${e.qty}` : ""}` : e.op === "set" ? `${name} set to ${e.qty}` : `Removed ${name}`;
          patchNora((parts) => [...parts, { k: "status", id: e.id, text: label }]);
          lastAction = label;
          newPara = true;
          later(async () => {
            await sleep(60); // let the status line render before flying from it
            if (e.op === "add") {
              const root = panel.current;
              const card = root ? [...root.querySelectorAll(`[data-pick-card="${e.id}"]`)].pop() : null;
              const from = card?.querySelector("[data-pick-art]") ?? (root ? [...root.querySelectorAll(`[data-status-art="${e.id}"]`)].pop() : null);
              press(root?.querySelector(`[data-pick-add="${e.id}"]`) ?? card ?? null);
              await flyToCart(from ?? null);
              add(e.id, e.qty, false);
              if (reducedMotion()) bumpCart();
            } else if (e.op === "set") {
              setQty(e.id, e.qty);
              bumpCart();
            } else {
              remove(e.id);
              bumpCart();
            }
          });
          break;
        }
        case "chips":
          nextChips = e.items; // shown once the turn is over
          break;
        case "checkout": {
          const { t: _t, ...plan } = e;
          void _t;
          checkout = plan;
          break;
        }
        case "done":
          finished = e.messages;
          break;
        case "error":
          patchNora((parts) => [...parts, { k: "text", text: e.message }]);
          break;
      }
    };

    try {
      abort.current = new AbortController();
      const res = await fetch("/api/nora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: history.current,
          ...input,
          cart: linesRef.current.map(({ id, qty }) => ({ id, qty })),
          account: memberRef.current ? "member" : "guest",
        }),
        signal: abort.current.signal,
      });

      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setUnavailable(true);
        handle({ t: "error", message: body?.message ?? `The concierge service returned ${res.status}.` });
      } else {
        setUnavailable(false);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (line) handle(JSON.parse(line) as NoraEvent);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") handle({ t: "error", message: (err as Error).message });
    }

    if (speak) voice.say(split.flush());
    if (speak && !spoke && lastAction) voice.say(`${lastAction}.`);

    // The transcript is append-only: exactly what the agent returned for this turn.
    if (finished) history.current = [...history.current, ...(finished as unknown[])];
    // drop an empty trailing bubble (e.g. after an error with no text)
    setMsgs((ms) => (ms[ms.length - 1]?.from === "nora" && (ms[ms.length - 1] as { parts: Part[] }).parts.length === 0 ? ms.slice(0, -1) : ms));

    await queue;
    if (speak) await voice.finished();
    if (nextChips.length) setChips(nextChips);
    let plan = checkout as CheckoutPlan | null;
    // Only a member can be checked out by Nora; a guest is taken to checkout to join first.
    if (plan && !memberRef.current) plan = { ...plan, pay: false };
    if (plan) {
      // Let the member read (or hear) Nora's reply before she acts on it.
      await sleep(speak ? 500 : 1800);
      // the checkout page picks this up and finishes the job with Nora's cursor
      try {
        sessionStorage.setItem("club-autopilot", JSON.stringify(plan));
      } catch {}
      setCartOpen(true);
      await sleep(900);
      const review = document.getElementById("review-order");
      await pointer.api.moveTo(review, plan.pay ? "Heading to checkout" : memberRef.current ? "Reviewing your order" : "Taking you to checkout");
      await pointer.api.click(review); // the link itself goes to /checkout
      setBusy(false);
      router.push("/checkout");
      return;
    }
    setBusy(false);
    if (speak && voiceOn.current) voice.listen();
  }
  sendRef.current = send;

  const voiceOff = () => {
    voiceOn.current = false;
    setVoiceMode(false);
    voice.stopAll();
    setDraft("");
  };
  /** The header mic: turn voice on, cut Nora off while she talks, listen again after a silence, or turn voice off. */
  const toggleVoice = () => {
    if (!voice.supported) return;
    if (voice.state === "speaking") return voice.stopSpeaking(); // she listens again right after
    if (voiceMode && voice.state === "idle" && !busy) return voice.listen(); // timed out in silence: listen again
    if (voiceMode) return voiceOff();
    voiceOn.current = true;
    setVoiceMode(true);
    if (!busy) voice.listen();
  };
  // Closing the window ends voice mode.
  useEffect(() => {
    if (!chatOpen && voiceOn.current) voiceOff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen]);

  const reset = () => {
    voiceOff();
    abort.current?.abort();
    history.current = [];
    setMsgs([]);
    setChips([]);
    setBusy(false);
    started.current = false;
  };

  // Her opening line is the same one the bubble over the launcher shows, so tapping it picks
  // up exactly where she left off. It goes into the transcript so the agent knows she said it.
  const greeting = session.member
    ? `Hi ${MEMBER.first}, it's ${PERSONA.name}. Tell me what tonight looks like and I'll have the right thing at your door.`
    : `Hi, I'm ${PERSONA.name}. Tell me what tonight looks like and I'll help you find just the right thing.`;
  useEffect(() => {
    if (chatOpen && !busy && !started.current && history.current.length === 0) {
      started.current = true;
      history.current = [
        { role: "user", content: "[chat opened]" },
        { role: "assistant", content: greeting },
      ];
      setMsgs([{ from: "nora", parts: [{ k: "text", text: greeting }] }]);
      setChips(["A calm night in", "Something for friends", "Help me sleep", "What's popular?"]);
    }
  }, [chatOpen, busy, greeting]);

  const micLabel = !voice.supported
    ? "Voice needs Chrome, Edge or Safari"
    : voice.state === "speaking"
      ? "Interrupt Nora"
      : voice.state === "listening"
        ? "Turn voice off"
        : voiceMode && !busy
          ? "Listen again"
          : voiceMode
            ? "Turn voice off"
            : "Talk by voice";
  const last = msgs[msgs.length - 1];
  const thinking = busy && last?.from === "nora" && last.parts.length === 0;

  return (
    <>
      {pointer.node}

      {/* Bottom right: a real person stacked above Nora. Both step aside while the chat is open. */}
      <div className={`fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3 sm:items-stretch ${mounted ? "pointer-events-none" : ""}`}>
      <CallRepButton hidden={mounted} />
      <button
        onClick={() => setChatOpen(true)}
        aria-hidden={mounted}
        tabIndex={mounted ? -1 : 0}
        className={`launcher-ring group relative flex origin-bottom-right items-center gap-3.5 rounded-full border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] p-1.5 pr-1.5 shadow-[var(--shadow-float)] transition-[transform,opacity,box-shadow] ease-[var(--ease-out)] hover:-translate-y-0.5 active:scale-95 sm:rounded-none sm:py-2 sm:pr-6 sm:pl-2 ${
          mounted ? "pointer-events-none scale-50 opacity-0 duration-200" : "scale-100 opacity-100 delay-150 duration-500"
        }`}
        aria-label={`Ask ${PERSONA.name}, your concierge`}
      >
        <NoraAvatar size={44} status />
        <span className="hidden text-left sm:block">
          <span className="display block text-[19px] leading-none">Ask {PERSONA.name}</span>
          <span className="mt-1 block text-[12px] text-[var(--color-muted)]">Your concierge</span>
        </span>
      </button>
      </div>

      {mounted && (
        <section
          role="dialog"
          aria-label={`Conversation with ${PERSONA.name}`}
          data-leaving={leaving}
          ref={panel}
          className="chat-window fixed inset-x-0 bottom-0 z-40 flex h-[88dvh] flex-col overflow-hidden rounded-t-none border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] shadow-[var(--shadow-float)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:h-[min(720px,calc(100dvh-110px))] sm:w-[420px] sm:rounded-none"
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-hairline)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="avatar-pop">
                <NoraAvatar size={40} status />
              </span>
              <div className="chat-part" style={{ animationDelay: "160ms" }}>
                <h2 className="display text-[22px] leading-none">{PERSONA.name}</h2>
                <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                  {voice.state === "listening" ? "Listening…" : voice.state === "speaking" ? "Speaking…" : busy ? "Typing…" : unavailable ? "Not connected" : `${PERSONA.role} · Available now`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="icon-btn" onClick={reset} aria-label="New conversation" title="New conversation">
                <RotateCcw size={16} strokeWidth={1.6} />
              </button>
              <button
                className={`icon-btn relative ${voiceMode ? "bg-[var(--color-brass)] text-[var(--color-on-brass)] hover:bg-[var(--color-brass-hi)] hover:text-[var(--color-on-brass)]" : ""}`}
                onClick={toggleVoice}
                disabled={!voice.supported}
                aria-pressed={voiceMode}
                aria-label={micLabel}
                title={micLabel}
              >
                {voice.state === "listening" && <span className="voice-ring pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden />}
                <Mic size={17} strokeWidth={1.5} />
              </button>
              <button className="icon-btn" onClick={() => setChatOpen(false)} aria-label="Minimize chat" autoFocus>
                <Minus size={18} />
              </button>
            </div>
          </header>

          <ol className="flex-1 space-y-5 overflow-y-auto px-4 pt-5 pb-6" aria-live="polite">
            <li className="text-center text-[12px] text-[var(--color-faint)]">Today</li>
            {msgs.map((m, i) => {
              const style = { animationDelay: "0ms" };
              if (m.from === "nora" && m.parts.length === 0) return null;
              if (m.from === "member") {
                return (
                  <li key={i} className="chat-part flex justify-end" style={style}>
                    <p className="max-w-[82%] rounded-none rounded-br-[4px] bg-[var(--color-raised-2)] px-3.5 py-2.5 text-[14px] leading-relaxed">{m.text}</p>
                  </li>
                );
              }
              if (m.parts.length === 0) return null;
              return (
                <li key={i} className="chat-part flex gap-2.5" style={style}>
                  <NoraAvatar size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="sr-only">{PERSONA.name} says</p>
                    {m.parts.map((part, j) =>
                      part.k === "text" ? (
                        <p key={j} className={`text-[14px] leading-relaxed text-[var(--color-ivory)]/92 ${j > 0 ? "mt-2.5" : ""}`}>
                          {plain(part.text)}
                        </p>
                      ) : part.k === "products" ? (
                        <div key={j} className="chat-part mt-3 grid gap-2">
                          {part.picks.map((pk) => (
                            <PickCard key={pk.id} {...pk} />
                          ))}
                        </div>
                      ) : (
                        <StatusLine key={j} id={part.id} text={part.text} />
                      ),
                    )}
                  </div>
                </li>
              );
            })}
            {thinking && (
              <li className="chat-part flex items-center gap-2.5">
                <NoraAvatar size={26} />
                <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--color-raised-2)] px-3" aria-label={`${PERSONA.name} is typing`}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="typing-dot size-1.5 rounded-full bg-[var(--color-muted)]" style={{ animationDelay: `${d * 160}ms` }} />
                  ))}
                </span>
              </li>
            )}
            <li ref={end} aria-hidden />
          </ol>

          <div className="chat-part shrink-0 border-t border-[var(--color-hairline)] px-4 pt-3 pb-4" style={{ animationDelay: "380ms" }}>
            {chips.length > 0 && (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3" role="list" aria-label="Suggested replies">
                {chips.map((c, i) => (
                  <button
                    key={c}
                    role="listitem"
                    className="chip chat-part h-8 text-[13px]"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => send({ message: c })}
                    disabled={busy}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send({ message: draft });
              }}
            >
              <label htmlFor="msg" className="sr-only">
                Message {PERSONA.name}
              </label>
              <textarea
                id="msg"
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send({ message: draft });
                  }
                }}
                placeholder={voice.state === "listening" ? "Listening… just start talking" : busy ? `${PERSONA.name} is on it…` : `Tell ${PERSONA.name} what you're after…`}
                className="field min-h-[46px] resize-none py-3 text-[15px] leading-snug"
              />
              <button ref={sendBtn} className="btn btn-primary size-[46px] shrink-0 p-0" aria-label="Send message" disabled={busy || !draft.trim()}>
                <ArrowUp size={19} />
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
