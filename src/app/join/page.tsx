"use client";

import { useState } from "react";
import Link from "next/link";
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
        {/* a still from the estate film, the same image the home page opens on */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/hero-poster.jpg" alt="" className="absolute inset-0 size-full scale-[1.08] object-cover object-[60%_50%] motion-safe:animate-[fade-in_1400ms_var(--ease-out)_both]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(17_17_17/0.2)_0%,rgb(17_17_17/0.15)_45%,rgb(17_17_17/0.72)_100%)]" />
        <div className="absolute inset-x-12 bottom-12 text-[#FAF9F6]">
          <p className="display max-w-[14ch] text-[56px] leading-[1.02]">Join the Club.</p>
          <p className="mt-5 max-w-[36ch] text-[15px] text-[#FAF9F6]/80">
            About five minutes. Every step here is a demo. Nothing you enter is stored.
          </p>
        </div>
      </aside>

      <JoinArrival contentId="join-content" />
      <div id="join-content" className="flex min-h-dvh flex-col">
        <header className="flex h-[76px] items-center justify-between px-5 sm:px-10">
          <Wordmark href="/shop" />
          {!done && (
            <Link href="/shop" className="nav-link smallcaps text-[var(--color-muted)]">
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
              <Link href="/shop" className="btn btn-lg btn-primary mt-10">
                Start shopping
              </Link>
            </div>
          )}
        </main>
        <footer className="border-t border-[var(--color-hairline)] px-5 py-5 text-[13px] text-[var(--color-muted)] sm:px-10">
          Members must be 21 or older. Demo only.
        </footer>
      </div>
    </div>
  );
}
