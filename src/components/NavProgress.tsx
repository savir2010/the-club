"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin brass bar at the top of the window from the moment a link is clicked until the next
 * page is on screen, so every click answers right away even while the page loads.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setState("loading");
    };
    document.addEventListener("click", onClick, true); // capture: Next's Link cancels the click before it bubbles
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // the new route rendered: finish the bar and fade it out
  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
    const t = window.setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 500);
    return () => window.clearTimeout(t);
  }, [pathname, search]);

  return <div className="nav-progress" data-state={state} aria-hidden />;
}
