"use client";

import { useState } from "react";
import { ArrowUp, ChevronLeft } from "lucide-react";
import { PERSONA } from "@/lib/data";
import { NoraAvatar } from "./brand";

// Simulated text thread. Nothing here touches a real SMS service.
// Every message from Nora arrives from the agent's send_text tool.
export type Text = { from: "nora" | "member"; text: string };

export function PhonePanel({
  texts,
  busy,
  onReply,
  onClose,
}: {
  texts: Text[];
  busy: boolean;
  onReply: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div
      className="h-[760px] max-h-[calc(100dvh-120px)] w-[375px] max-w-[calc(100vw-32px)] animate-[slide-in_300ms_var(--ease-out)_both] rounded-[48px] border border-[var(--color-hairline-strong)] bg-[#1d1a16] p-3 shadow-[var(--shadow-float)]"
      role="region"
      aria-label="Simulated phone"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] bg-[#fbf8f3]">
        <div className="mx-auto mt-2.5 h-7 w-28 rounded-full bg-black" aria-hidden />
        <p className="smallcaps mt-3 text-center text-[var(--color-brass)]">Simulated text</p>
        <div className="mt-3 flex items-center gap-2 border-b border-[var(--color-hairline)] px-4 pb-3">
          <button className="icon-btn -ml-2" onClick={onClose} aria-label="Hide phone">
            <ChevronLeft size={20} />
          </button>
          <NoraAvatar size={32} />
          <div>
            <p className="text-[14px] font-medium leading-tight">{PERSONA.name} · The Club</p>
            <p className="text-[12px] text-[var(--color-muted)]">{PERSONA.role}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 text-[15px] leading-snug" aria-live="polite">
          {texts.length === 0 && !busy && <p className="m-auto text-center text-[13px] text-[var(--color-faint)]">No texts yet</p>}
          {texts.map((t, i) =>
            t.from === "nora" ? (
              <p key={i} className="chat-part max-w-[80%] rounded-[18px] rounded-bl-[6px] bg-[#ebe5db] px-3.5 py-2">
                {t.text}
              </p>
            ) : (
              <p key={i} className="chat-part ml-auto w-fit max-w-[80%] rounded-[18px] rounded-br-[6px] bg-[var(--color-brass)] px-3.5 py-2 text-[var(--color-on-brass)]">
                {t.text}
              </p>
            ),
          )}
          {busy && (
            <span className="inline-flex h-8 w-fit items-center gap-1 rounded-full bg-[#ebe5db] px-3" aria-label={`${PERSONA.name} is typing`}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="typing-dot size-1.5 rounded-full bg-[var(--color-muted)]" style={{ animationDelay: `${d * 160}ms` }} />
              ))}
            </span>
          )}
        </div>
        <form
          className="flex items-center gap-2 border-t border-[var(--color-hairline)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim() || busy) return;
            onReply(draft.trim());
            setDraft("");
          }}
        >
          <label htmlFor="sms" className="sr-only">
            Text message
          </label>
          <input
            id="sms"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Text message"
            className="h-10 flex-1 rounded-full border border-[var(--color-hairline-strong)] bg-transparent px-4 text-[15px] placeholder:text-[var(--color-faint)] focus:border-[var(--color-brass)] focus:outline-none"
          />
          <button className="grid size-9 place-items-center rounded-full bg-[var(--color-brass)] text-[var(--color-on-brass)] disabled:opacity-40" aria-label="Send" disabled={busy || !draft.trim()}>
            <ArrowUp size={18} />
          </button>
        </form>
        <div className="mx-auto mb-2 h-1 w-32 rounded-full bg-[var(--color-ivory)]/40" aria-hidden />
      </div>
    </div>
  );
}
