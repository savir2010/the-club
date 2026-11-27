"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Landing-only cinematic layer: the graded aerial film of the estate, fixed behind the page.
 * As the visitor scrolls, the film slowly settles (a gentle zoom) and an off-white veil rises over it;
 * open sections later in the page let it show through again.
 * The film always plays (muted, inline, looping); reduced motion only turns off the scroll zoom.
 * If the browser refuses to play it (Low Power Mode, Save-Data), the still poster stays.
 */
export function LandingBackground() {
  const video = useRef<HTMLVideoElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Pick the encode for the screen; skip the film only when the visitor has asked to save data.
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) return;
    const wide = window.matchMedia("(min-width: 900px) and (min-resolution: 1.5dppx), (min-width: 1300px)").matches;
    setSrc(wide ? "/media/hero-1080.mp4" : "/media/hero-720.mp4");
  }, []);

  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    // React doesn't reliably write the muted attribute, and Safari refuses unmuted autoplay
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    // some browsers only allow playback after the first interaction; retry then
    const onFirst = () => tryPlay();
    window.addEventListener("pointerdown", onFirst, { once: true });
    window.addEventListener("touchstart", onFirst, { once: true, passive: true });
    // pause when the tab is hidden; resume when it returns
    const onVis = () => (document.hidden ? v.pause() : v.play().catch(() => {}));
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("touchstart", onFirst);
    };
  }, [src]);

  useEffect(() => {
    let raf = 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const y = window.scrollY;
      const hero = Math.min(1, y / vh);
      document.documentElement.style.setProperty("--hero-out", hero.toFixed(3));
      if (veil.current) veil.current.style.opacity = (hero * 0.12).toFixed(3);
      if (film.current && !still) film.current.style.transform = `scale(${(1.04 + hero * 0.06).toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.documentElement.style.removeProperty("--hero-out");
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#242424]" aria-hidden>
      {/* one notch under the full grade: still vivid, a little calmer (tune saturate/brightness here) */}
      <div ref={film} className="absolute inset-0 will-change-transform [filter:saturate(0.86)_brightness(0.95)_contrast(1.02)]" style={{ transform: "scale(1.04)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/hero-poster.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        {src && (
          <video
            ref={video}
            src={src}
            poster="/media/hero-poster.jpg"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            onPlaying={() => setReady(true)}
            className="absolute inset-0 size-full object-cover transition-opacity duration-[1400ms] ease-[var(--ease-out)]"
            style={{ opacity: ready ? 1 : 0 }}
          />
        )}
      </div>
      <div className="absolute inset-0 bg-[#111111]/[0.06]" />
      {/* legibility only: a light shade behind the header and a deeper one where the headline sits; the film's colour stays full */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(17_17_17/0.42)_0%,rgb(17_17_17/0)_18%,rgb(17_17_17/0)_48%,rgb(17_17_17/0.66)_100%)]" />
      <div ref={veil} className="absolute inset-0 bg-[#111111]" style={{ opacity: 0 }} />
    </div>
  );
}

/** Fades sections up once as they enter the viewport. Content is visible without JS. */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
    );
    // only hide what is still below the fold, so nothing visible ever blinks out
    for (const n of nodes) {
      if (n.getBoundingClientRect().top > window.innerHeight * 0.9) {
        n.classList.add("reveal-pending");
        io.observe(n);
      }
    }
    root.classList.add("reveal-ready");
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
  return null;
}
