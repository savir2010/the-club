"use client";

import { useEffect, useRef, useState } from "react";
import MoltenMetal from "./MoltenMetal";

/** True when WebGL runs on a software renderer (no GPU) or is missing entirely. */
function softwareRendered(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(name);
  } catch {
    return true;
  }
}

/**
 * Landing-only molten brass layer, fixed behind the page.
 * As the visitor scrolls it dims, cools and turns slowly; the hero copy lifts away.
 * Without a GPU it renders one frame and holds still.
 */
export function LandingBackground() {
  const [software, setSoftware] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const veil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSoftware(softwareRendered());
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const y = window.scrollY;
      // 0 at the top, 1 after one viewport of scrolling
      const hero = Math.min(1, y / vh);
      document.documentElement.style.setProperty("--hero-out", hero.toFixed(3));
      if (veil.current) veil.current.style.opacity = (hero * 0.4).toFixed(3);
      // coarse steps keep shader re-renders cheap
      const total = Math.max(1, document.documentElement.scrollHeight - vh);
      setProgress(Math.round((y / total) * 40) / 40);
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

  if (software === null) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[var(--color-canvas)]" aria-hidden>
      <MoltenMetal
        colors={["#efe4d2", "#d9bf95", "#b8925a", "#8d6b3d"]}
        coreColor="#fffaf0"
        lightMode
        speed={0.24}
        scale={2.8}
        detail={software ? 2.5 : 3.5}
        glow={1.6}
        thickness={1.05}
        haze={0.7}
        brightness={1.25}
        grain={0.04}
        rotation={progress * 28}
        offsetY={progress * -0.18}
        opacity={1 - progress * 0.35}
        drift={0.22}
        mouseInteraction={!software}
        mouseStrength={0.35}
        flareOnClick={false}
        paused={software}
        intro={!software}
        dpr={software ? 0.6 : 1.25}
      />
      {/* vignette keeps the centre calm behind the headline and deepens the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_42%_at_50%_45%,rgb(247_242_234/0.72)_0%,rgb(247_242_234/0.2)_65%,rgb(247_242_234/0)_100%)]" />
      <div ref={veil} className="absolute inset-0 bg-[var(--color-canvas)]" style={{ opacity: 0 }} />
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
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
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
