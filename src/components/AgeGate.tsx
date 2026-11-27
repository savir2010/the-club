"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Monogram } from "./brand";

const KEY = "club-age-ok";

export function AgeGate() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname === "/come-back-later") return;
    let ok = false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("gate")) localStorage.removeItem(KEY);
      if (params.has("nogate")) localStorage.setItem(KEY, "1");
      ok = localStorage.getItem(KEY) === "1";
    } catch {}
    setOpen(!ok);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    yesRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const yes = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-title"
      className="fixed inset-0 z-[100] grid place-items-center px-5"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const nodes = e.currentTarget.querySelectorAll<HTMLElement>("button");
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="absolute inset-0 bg-[#FAF9F6]/45 backdrop-blur-[18px]" aria-hidden />
      <div className="relative w-full max-w-[440px] animate-fade-up rounded-[var(--radius-panel)] border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)]/92 px-7 pt-9 pb-7 text-center shadow-[var(--shadow-float)] sm:px-10">
        <div className="mx-auto mb-6 w-fit">
          <Monogram size={48} />
        </div>
        <h1 id="age-title" className="display text-[30px] sm:text-[34px]">
          Are you 21 or older?
        </h1>
        <p className="mx-auto mt-4 max-w-[34ch] text-[14px] text-[var(--color-muted)]">
          The Club is a private delivery service for adults in Arizona.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button className="btn btn-outline" onClick={() => router.push("/come-back-later")}>
            No
          </button>
          <button ref={yesRef} className="btn btn-primary" onClick={yes}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
