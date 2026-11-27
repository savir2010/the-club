"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NoraAvatar } from "./brand";

/*
 * Nora's own cursor. When she acts on the page for the member (checking out, picking a
 * delivery window, paying) a brass pointer with her name tag glides to each control,
 * rings it, says what she's doing, and clicks it for real.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type NoraPointerApi = {
  /** Glide to an element (scrolling it into view first) and show a caption. */
  moveTo: (el: Element | null, caption?: string) => Promise<void>;
  /** Ring the element, press, and click it for real. */
  click: (el: Element | null) => Promise<void>;
  /** Show a caption without moving. */
  say: (caption: string) => void;
  hide: () => void;
};

export function useNoraPointer(start?: () => { x: number; y: number }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [caption, setCaption] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const pos = useRef<{ x: number; y: number } | null>(null);
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => setMounted(true), []);

  const place = (x: number, y: number) => {
    pos.current = { x, y };
    if (root.current) root.current.style.transform = `translate(${x}px, ${y}px)`;
  };

  const moveTo = useCallback(async (el: Element | null, text?: string) => {
    if (!el) return;
    if (text !== undefined) setCaption(text);
    const r0 = el.getBoundingClientRect();
    if (r0.top < 80 || r0.bottom > window.innerHeight - 80) {
      el.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
      await sleep(reduced() ? 50 : 520);
    }
    const r = el.getBoundingClientRect();
    const to = { x: r.left + Math.min(r.width * 0.5, r.width - 14), y: r.top + r.height * 0.55 };
    if (!pos.current) {
      const s = startRef.current?.() ?? { x: window.innerWidth - 120, y: window.innerHeight - 140 };
      place(s.x, s.y);
    }
    setVisible(true);
    const from = pos.current!;
    const el2 = root.current;
    if (el2 && !reduced()) {
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const anim = el2.animate([{ transform: `translate(${from.x}px, ${from.y}px)` }, { transform: `translate(${to.x}px, ${to.y}px)` }], {
        duration: Math.max(420, Math.min(1000, dist * 1.1)),
        easing: EASE,
        fill: "forwards",
      });
      await anim.finished.catch(() => {});
      anim.cancel();
    }
    place(to.x, to.y);
  }, []);

  const click = useCallback(async (el: Element | null) => {
    if (!el) return;
    const target = el as HTMLElement;
    target.classList.add("nora-target");
    await sleep(reduced() ? 0 : 420);
    const p = pos.current;
    if (p && !reduced()) {
      const ripple = document.createElement("span");
      ripple.className = "nora-ripple";
      Object.assign(ripple.style, { left: `${p.x - 22}px`, top: `${p.y - 22}px` });
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
      root.current?.querySelector("svg")?.animate([{ transform: "scale(1)" }, { transform: "scale(0.82)" }, { transform: "scale(1)" }], { duration: 240, easing: EASE });
    }
    target.click();
    await sleep(reduced() ? 50 : 380);
    target.classList.remove("nora-target");
  }, []);

  const say = useCallback((text: string) => setCaption(text), []);
  const hide = useCallback(() => {
    setVisible(false);
    pos.current = null;
  }, []);

  const api = useMemo<NoraPointerApi>(() => ({ moveTo, click, say, hide }), [moveTo, click, say, hide]);

  const node = mounted
    ? createPortal(
        <div
          ref={root}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-[95] transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0, transform: pos.current ? `translate(${pos.current.x}px, ${pos.current.y}px)` : "translate(-200px,-200px)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" className="-translate-x-[3px] -translate-y-[2px] drop-shadow-[0_4px_8px_rgb(60_44_20/0.35)]">
            <path d="M4 2.5 19.5 12l-6.8 1.6 3.9 7.2-2.6 1.4-3.9-7.2L4.6 19.6z" fill="#111111" stroke="#FAF9F6" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <div className="mt-0.5 ml-4 flex w-max max-w-[300px] items-center gap-1.5 bg-[#111111] py-1 pr-3 pl-1 text-[12px] leading-none text-white shadow-[0_8px_20px_-6px_rgb(60_44_20/0.5)]">
            <span className="overflow-hidden rounded-full ring-1 ring-white/60">
              <NoraAvatar size={20} />
            </span>
            <span className="font-medium">Nora</span>
            {caption && <span className="truncate text-white/85">· {caption}</span>}
          </div>
        </div>,
        document.body,
      )
    : null;

  return { api, node };
}
