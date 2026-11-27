"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/lib/session";

/** Account pages: a guest is asked to sign in instead. */
export function SignedInOnly({ children }: { children: ReactNode }) {
  const { ready, signedIn } = useSession();
  const path = usePathname();
  if (!ready) return <div className="min-h-[60vh]" />;
  if (signedIn) return <>{children}</>;
  return (
    <main className="container-club grid min-h-[60vh] place-items-center py-24 text-center">
      <div className="max-w-[420px]">
        <h1 className="display text-[36px]">Sign in to see your account</h1>
        <p className="mt-3 text-[var(--color-muted)]">Orders, your subscriptions and delivery addresses live here.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/signin?next=${encodeURIComponent(path)}`} className="btn btn-primary px-7">Sign in</Link>
          <Link href="/shop" className="btn btn-outline px-7">Keep shopping</Link>
        </div>
      </div>
    </main>
  );
}
