"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

/** "Speak to someone": a quiet header link that rings a representative's phone through /api/call-rep. */
export function CallRepButton({ className = "" }: { className?: string }) {
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

  const label =
    state === "calling" ? "Calling…" : state === "done" ? "Someone will ring you" : state === "error" ? "Couldn’t call, retry" : "Speak to someone";

  return (
    <button
      type="button"
      onClick={call}
      disabled={state === "calling"}
      aria-live="polite"
      title="Speak to someone at the Club"
      className={`nav-link smallcaps inline-flex h-10 shrink-0 items-center gap-2 px-1 disabled:opacity-70 ${className}`}
    >
      <Phone size={14} strokeWidth={1.25} aria-hidden />
      <span className="hidden lg:inline">{label}</span>
      <span className="sr-only lg:hidden">{label}</span>
    </button>
  );
}
