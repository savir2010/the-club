"use client";

import { useState } from "react";
import Link from "next/link";
import { Aurora } from "@/components/Aurora";
import { JoinArrival } from "@/components/JoinTransition";
import { MEMBER, PERSONA } from "@/lib/data";
import { useSession } from "@/lib/session";
import { NoraAvatar, Wordmark } from "@/components/brand";
import { MembershipFlow } from "@/components/membership/MembershipFlow";

export default function Join() {
  const { signedIn, join } = useSession();
  const [done, setDone] = useState(false);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Atmosphere panel */}
      <aside className="relative hidden overflow-hidden lg:sticky lg:top-0 lg:block lg:h-dvh lg:self-start" aria-hidden>
        <Aurora />
        <div className="absolute inset-x-12 bottom-12">
          <p className="display max-w-[14ch] text-[44px] leading-[1.05]">Join the Club.</p>
          <p className="mt-4 max-w-[36ch] text-[15px] text-[var(--color-muted)]">
            About five minutes. Every step here is a demo. Nothing you enter is stored.
          </p>
        </div>
      </aside>

      <JoinArrival contentId="join-content" />
      <div id="join-content" className="flex min-h-dvh flex-col">
        <header className="flex h-[76px] items-center justify-between px-5 sm:px-10">
          <Wordmark href="/shop" />
          {!done && (
            <Link href="/shop" className="text-[14px] text-[var(--color-muted)] hover:text-[var(--color-ivory)]">
              Back to the shop
            </Link>
          )}
        </header>

        <main className="flex flex-1 flex-col px-5 pt-6 pb-10 sm:px-10 lg:px-16">
          {!done ? (
            <MembershipFlow
              skipAccount={signedIn}
              signInHref="/signin?next=/shop"
              onDone={() => {
                join();
                setDone(true);
              }}
            />
          ) : (
            <div className="max-w-[560px] animate-[fade-up_300ms_var(--ease-out)_both] pt-4">
              <NoraAvatar size={88} status />
              <h1 className="display mt-8 text-[48px] sm:text-[60px]">Welcome to the Club, {MEMBER.first}.</h1>
              <div className="mt-6 max-w-[52ch] space-y-4 text-[17px] leading-relaxed text-[var(--color-ivory)]/90">
                <p>
                  I&rsquo;m {PERSONA.name}, your concierge. Member prices are now on across the shop. Tell me what you&rsquo;re after and
                  I&rsquo;ll find it, fill your cart and have it brought to your door.
                </p>
              </div>
              <Link href="/shop" className="btn btn-lg btn-primary mt-10 rounded-full">
                Start shopping
              </Link>
            </div>
          )}
        </main>
        <footer className="border-t border-[var(--color-hairline)] px-5 py-5 text-[13px] text-[var(--color-muted)] sm:px-10">
          21+ or 18+ with a valid Arizona medical marijuana card. Demo only.
        </footer>
      </div>
    </div>
  );
}
