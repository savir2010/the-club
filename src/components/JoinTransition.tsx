"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aurora } from "./Aurora";

/*
 * "Request membership" page transition.
 * Leaving: an aurora panel slides in from the left and covers the page.
 * Arriving on /join: the same panel draws back into the join page's left column
 * (off to the left on small screens) while the form slides in from the right.
 */

const FLAG = "club-join-slide";
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function JoinLink({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => router.prefetch("/join"), [router]);

  useLayoutEffect(() => {
    if (!leaving || !panel.current) return;
    const a = panel.current.animate([{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }], { duration: 620, easing: EASE, fill: "forwards" });
    a.finished.then(() => {
      try {
        sessionStorage.setItem(FLAG, "1");
      } catch {}
      router.push("/join");
    });
  }, [leaving, router]);

  return (
    <>
      <Link
        href="/join"
        className={className}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || reduced()) return;
          e.preventDefault();
          setLeaving(true);
        }}
      >
        {children}
      </Link>
      {leaving &&
        createPortal(
          <div ref={panel} className="fixed inset-0 z-[100] shadow-[24px_0_60px_-20px_rgb(60_44_20/0.35)]" style={{ transform: "translateX(-100%)" }} aria-hidden>
            <Aurora />
          </div>,
          document.body,
        )}
    </>
  );
}

/** Mount once on /join. Plays the arrival half when the member came through JoinLink. */
export function JoinArrival({ contentId }: { contentId: string }) {
  const [arriving] = useState(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem(FLAG) === "1";
    } catch {
      return false;
    }
  });
  const panel = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useLayoutEffect(() => {
    if (!arriving) return;
    try {
      sessionStorage.removeItem(FLAG);
    } catch {}
    if (!panel.current) return;
    // On wide screens the join page's own aurora column is 5/12 of the width.
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const rest = wide ? `${(7 / 12) * 100}%` : "100%";
    panel.current
      .animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: `inset(0 ${rest} 0 0)` }], { duration: 760, delay: 80, easing: EASE, fill: "forwards" })
      .finished.then(() => setGone(true));
    document.getElementById(contentId)?.animate(
      [
        { transform: "translateX(48px)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 700, delay: 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" },
    );
  }, [arriving, contentId]);

  if (!arriving || gone) return null;
  return (
    <div ref={panel} className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      <Aurora />
    </div>
  );
}
