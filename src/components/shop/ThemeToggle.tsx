"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Kept in memory only: dark mode lasts while moving between shop, checkout and tracking,
// and every fresh load or reload starts in light mode.
let current: "light" | "dark" = "light";
const read = () => current;

/**
 * Light/dark switch for the shop. Light is the default on every load; a switch to dark
 * carries through the shop, checkout and order tracking, so the landing and join pages stay light.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(read());
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);

  useEffect(() => {
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    current = next;
  };

  return (
    <button onClick={flip} className="icon-btn" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Light mode" : "Dark mode"}>
      {theme === "dark" ? <Sun size={19} strokeWidth={1.6} aria-hidden /> : <Moon size={19} strokeWidth={1.6} aria-hidden />}
    </button>
  );
}

/** Applies the saved theme on pages that follow the shop (checkout, order tracking) but have no toggle of their own. */
export function ThemeSync() {
  useEffect(() => {
    if (read() === "dark") document.documentElement.dataset.theme = "dark";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, []);
  return null;
}
