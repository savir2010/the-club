"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { MEMBER } from "@/lib/data";
import { useSession } from "@/lib/session";
import { Wordmark } from "@/components/brand";
import { SiteFooter } from "@/components/SiteChrome";

export function SignIn({ next }: { next: string }) {
  const { signIn } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bar">
        <div className="mx-auto flex h-[64px] max-w-[1600px] items-center px-5">
          <Wordmark href="/shop" />
        </div>
      </div>

      <main className="flex flex-1 items-start justify-center px-4 pt-14 pb-20 sm:pt-20">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[20px] bg-[var(--color-raised)] p-7 ring-1 ring-[var(--color-hairline)] shadow-[var(--shadow-float)] sm:p-9">
            <h1 className="display text-[34px]">Sign in</h1>
            <p className="mt-2 text-[14px] text-[var(--color-muted)]">Welcome back to the Club.</p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setBusy(true);
                signIn();
                setTimeout(() => router.push(next), 450);
              }}
            >
              <div>
                <label htmlFor="email" className="field-label">Email or mobile number</label>
                <input id="email" className="field" type="email" autoComplete="username" defaultValue={MEMBER.email} required />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="pw" className="field-label">Password</label>
                  <button type="button" className="btn-text mb-1.5 text-[13px] text-[var(--color-muted)]">Forgot it?</button>
                </div>
                <input id="pw" className="field" type="password" autoComplete="current-password" defaultValue="clubdemo2026" required />
              </div>
              <button className="btn btn-lg btn-primary w-full rounded-full" disabled={busy}>
                {busy ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-[var(--color-on-brass)]/30 border-t-[var(--color-on-brass)]" aria-hidden />
                ) : (
                  <Lock size={16} aria-hidden />
                )}
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-[12px] leading-relaxed text-[var(--color-faint)]">
              Demo account: {MEMBER.first} {MEMBER.last}, a Club member since {MEMBER.since}. Nothing is checked or stored.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4 text-[13px] text-[var(--color-muted)]">
            <span className="h-px flex-1 bg-[var(--color-hairline-strong)]" />
            New to the Club?
            <span className="h-px flex-1 bg-[var(--color-hairline-strong)]" />
          </div>
          <Link href="/shop" className="btn btn-lg btn-outline mt-5 w-full rounded-full">
            Start shopping
          </Link>
          <p className="mt-3 text-center text-[13px] text-[var(--color-muted)]">Browse freely. You&rsquo;ll join when you check out.</p>
        </div>
      </main>
      <SiteFooter compact />
    </div>
  );
}
