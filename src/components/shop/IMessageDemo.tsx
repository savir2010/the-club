"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useShop } from "./ShopState";

/**
 * Scripted iMessage demo. Press Control+Shift+I anywhere in the shop: Nora texts the demo phone
 * (NORA_IMESSAGE_TO) about the cart from this Mac's Messages app. When the phone replies YES,
 * the site moves to order tracking, as if the order had been placed from the text thread.
 */
export function IMessageDemo() {
  const { lines } = useShop();
  const router = useRouter();
  const [note, setNote] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const polling = useRef<number | null>(null);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    const stopPolling = () => {
      if (polling.current) window.clearInterval(polling.current);
      polling.current = null;
    };

    const start = async () => {
      stopPolling();
      setNote({ text: "Nora is texting Dana's phone…", tone: "ok" });
      try {
        const res = await fetch("/api/nora/imessage/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart: linesRef.current.map(({ id, qty }) => ({ id, qty })) }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message ?? "The text didn't send.");
        if (body.error) {
          setNote({ text: `Texts sent, but replies can't be read: ${body.error}`, tone: "error" });
          return;
        }
        setNote({ text: "Texts sent. Waiting for a reply…", tone: "ok" });
        polling.current = window.setInterval(async () => {
          const s = await fetch("/api/nora/imessage/status").then((r) => r.json()).catch(() => null);
          if (!s) return;
          if (s.phase === "confirmed") {
            stopPolling();
            setNote(null);
            router.push("/orders/CL-20512");
          } else if (!s.active) {
            stopPolling();
            setNote(s.error ? { text: s.error, tone: "error" } : null);
          }
        }, 1500);
      } catch (e) {
        setNote({ text: (e as Error).message, tone: "error" });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && !e.metaKey && !e.altKey && e.code === "KeyI") {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stopPolling();
    };
  }, [router]);

  // the note fades on its own, except errors
  useEffect(() => {
    if (!note || note.tone === "error") return;
    const t = window.setTimeout(() => setNote(null), 4000);
    return () => window.clearTimeout(t);
  }, [note]);

  if (!note) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-5 left-5 z-50 flex max-w-[360px] animate-[fade-up_240ms_var(--ease-out)_both] items-start gap-2.5 rounded-[12px] border bg-[var(--color-raised)] px-4 py-3 text-[13px] shadow-[var(--shadow-float)] ${
        note.tone === "error" ? "border-[var(--color-clay)]/50" : "border-[var(--color-hairline-strong)]"
      }`}
    >
      <MessageCircle size={16} className={`mt-px shrink-0 ${note.tone === "error" ? "text-[var(--color-clay)]" : "text-[var(--color-sage)]"}`} aria-hidden />
      <span>{note.text}</span>
      {note.tone === "error" && (
        <button className="btn-text ml-1 text-[12px] text-[var(--color-muted)]" onClick={() => setNote(null)}>
          Dismiss
        </button>
      )}
    </div>
  );
}
