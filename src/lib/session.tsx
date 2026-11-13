"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/*
 * Demo session. Anyone can browse and fill a cart as a guest; checkout asks them to join.
 * Signing in uses the demo account (Dana, already a member). Joining at checkout signs the
 * guest in as Dana and makes the membership active. Kept in this browser only.
 *
 * URL overrides for demos and recordings: ?as=guest, ?as=member.
 */

export type Session = { signedIn: boolean; member: boolean };
type SessionApi = Session & {
  ready: boolean;
  signIn: () => void;
  signOut: () => void;
  join: () => void;
};

const KEY = "club-session";
const GUEST: Session = { signedIn: false, member: false };
const Ctx = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Session>(GUEST);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let next = GUEST;
    try {
      const as = new URLSearchParams(window.location.search).get("as");
      if (as === "guest") localStorage.removeItem(KEY);
      if (as === "member") localStorage.setItem(KEY, JSON.stringify({ signedIn: true, member: true }));
      const saved = localStorage.getItem(KEY);
      if (saved) next = { ...GUEST, ...JSON.parse(saved) };
    } catch {}
    setS(next);
    setReady(true);
  }, []);

  const save = useCallback((next: Session) => {
    setS(next);
    try {
      if (next.signedIn) localStorage.setItem(KEY, JSON.stringify(next));
      else localStorage.removeItem(KEY);
    } catch {}
  }, []);

  const value = useMemo<SessionApi>(
    () => ({
      ...s,
      ready,
      signIn: () => save({ signedIn: true, member: true }),
      signOut: () => save(GUEST),
      join: () => save({ signedIn: true, member: true }),
    }),
    [s, ready, save],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
