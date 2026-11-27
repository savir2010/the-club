"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

/**
 * "Speak to someone": a copper button that sits beside Ask Nora at the bottom right and rings a
 * representative's phone through /api/call-rep. On phones it's a round button like Nora's.
 */
export function CallRepButton({ hidden = false }: { hidden?: boolean }) {
  const [state, setState] = useState<"idle" | "calling" | "done" | "error">("idle");

  const call = async () => {
    if (state === "calling") return;
    setState("calling");
    try {
      const r = await fetch("/api/call-rep", { method: "POST" });
      const body = (await r.json().catch(() => ({}))) as { ok?: boolean };
      setState(r.ok && body.ok ? "done" : "error");
    } catch {
      setState("error");
    }
    window.setTimeout(() => setState("idle"), 6000);
  };

  const [title, note] =
    state === "calling"
      ? ["Calling…", "Reaching a representative"]
      : state === "done"
        ? ["Representative called", "They’ll be with you shortly"]
        : state === "error"
          ? ["Couldn’t call", "Tap to try again"]
          : ["Speak to someone", "A real person, right now"];

  return (
    <button
      type="button"
      onClick={call}
      disabled={state === "calling"}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      aria-label={`${title}. ${note}`}
      aria-live="polite"
      className={`call-ring relative flex origin-bottom-right items-center gap-3.5 rounded-full bg-[var(--color-copper)] p-1.5 text-white shadow-[var(--shadow-float)] transition-[transform,opacity,background-color] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-[var(--color-copper-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-copper)] active:scale-95 disabled:cursor-progress sm:rounded-none sm:py-2 sm:pr-6 sm:pl-2 ${
        hidden ? "pointer-events-none scale-50 opacity-0 duration-200" : "scale-100 opacity-100 delay-100 duration-500"
      }`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">
        <Phone size={19} strokeWidth={1.6} aria-hidden className={state === "calling" ? "animate-pulse" : ""} />
      </span>
      <span className="hidden text-left sm:block">
        <span className="display block text-[19px] leading-none">{title}</span>
        <span className="mt-1 block text-[12px] text-white/80">{note}</span>
      </span>
    </button>
  );
}
