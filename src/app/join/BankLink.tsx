"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Lock, Search, ShieldCheck } from "lucide-react";
import { BANKS, BankBadge, type Bank } from "@/components/BankLogos";

type Stage = "pick" | "login" | "verifying" | "code" | "accounts" | "linking" | "linked";

const ACCOUNTS = [
  { id: "chk", name: "Everyday Checking", mask: "1234", balance: "$2,481.36", kind: "Checking" },
  { id: "sav", name: "High Yield Savings", mask: "5521", balance: "$9,120.04", kind: "Savings" },
];

function Spinner() {
  return <span className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--color-hairline-strong)] border-t-[var(--color-brass)]" aria-hidden />;
}

/** Simulated bank connection, modeled on the account-linking flows members know. Nothing is connected. */
export function BankLink({ onLinked }: { onLinked: (summary: string | null) => void }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [bank, setBank] = useState<Bank | null>(null);
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState("chk");

  // timed hops between "working" stages
  useEffect(() => {
    if (stage === "verifying") {
      const t = setTimeout(() => setStage("code"), 1300);
      return () => clearTimeout(t);
    }
    if (stage === "linking") {
      const t = setTimeout(() => setStage("linked"), 1400);
      return () => clearTimeout(t);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === "linked" && bank) {
      const a = ACCOUNTS.find((x) => x.id === account)!;
      onLinked(`${bank.name} · ${a.kind} ••••${a.mask}`);
    }
  }, [stage, bank, account, onLinked]);

  const choose = (b: Bank) => {
    setBank(b);
    setStage("login");
    onLinked(null);
  };
  const restart = () => {
    setStage("pick");
    setBank(null);
    onLinked(null);
  };

  if (stage === "pick") {
    const shown = BANKS.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase()));
    return (
      <div>
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-faint)]" aria-hidden />
          <label htmlFor="bank-search" className="sr-only">Search banks</label>
          <input id="bank-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for your bank" className="field pl-10" />
        </div>
        <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
          {shown.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => choose(b)}
                className="group flex w-full flex-col items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-hairline-strong)] bg-[var(--color-raised)] px-2 py-5 text-center transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-ivory)]/30 hover:shadow-[0_10px_24px_-14px_rgb(60_44_20/0.35)]"
              >
                <BankBadge bank={b} size={56} />
                <span className="text-[13px] leading-tight font-medium">{b.short}</span>
              </button>
            </li>
          ))}
        </ul>
        {shown.length === 0 && <p className="mt-6 text-[14px] text-[var(--color-muted)]">No bank by that name in the demo.</p>}
        <p className="mt-5 flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
          <Lock size={14} aria-hidden /> Demo only. No real account is ever connected.
        </p>
      </div>
    );
  }

  // Everything after "pick" happens inside a secure-connect frame for the chosen bank.
  const b = bank!;
  const acct = ACCOUNTS.find((x) => x.id === account)!;
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-hairline)] px-5 py-3.5">
        {stage === "linked" ? (
          <span />
        ) : (
          <button onClick={restart} className="icon-btn -ml-2" aria-label="Choose a different bank">
            <ArrowLeft size={18} />
          </button>
        )}
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
          <Lock size={13} aria-hidden /> Secure connection · demo
        </span>
        <span className="w-8" />
      </div>

      <div key={stage} className="animate-[fade-up_260ms_var(--ease-out)_both] px-6 pt-6 pb-7">
        <div className="flex items-center gap-3">
          <BankBadge bank={b} size={40} />
          <div>
            <p className="text-[16px] font-medium leading-tight">{b.name}</p>
            <p className="text-[12px] text-[var(--color-muted)]">
              {stage === "login" ? "Connect your account" : stage === "code" ? "Verify it's you" : stage === "accounts" ? "Choose an account" : "Connecting"}
            </p>
          </div>
        </div>

        {stage === "login" && (
          <div className="mt-6">
            <ul className="space-y-3 text-[14px]">
              {[
                `You'll sign in on ${b.short}'s own secure page.`,
                "The Club never sees your username or password.",
                "You choose which account pays for orders.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <ShieldCheck size={17} className="mt-px shrink-0 text-[var(--color-sage)]" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <button className="btn btn-primary mt-6 w-full" style={{ background: b.color, color: b.ink }} onClick={() => setStage("verifying")}>
              Continue to {b.short} <ChevronRight size={16} aria-hidden />
            </button>
            <p className="mt-3 text-center text-[12px] text-[var(--color-faint)]">Demo: no sign-in page opens and nothing is connected.</p>
          </div>
        )}

        {(stage === "verifying" || stage === "linking") && (
          <div className="mt-8 flex flex-col items-center py-6 text-center" role="status">
            <Spinner />
            <p className="mt-4 text-[15px]">{stage === "verifying" ? `Connecting to ${b.short}…` : "Linking your account…"}</p>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">{stage === "verifying" ? "Waiting for your bank to confirm" : "Confirming account and routing numbers"}</p>
          </div>
        )}

        {stage === "code" && (
          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              setStage("accounts");
            }}
          >
            <p className="text-[14px] text-[var(--color-muted)]">We texted a 6-digit code to (•••) •••-0147.</p>
            <label htmlFor="bank-code" className="sr-only">Verification code</label>
            <div className="mt-4 grid grid-cols-6 gap-2" aria-hidden>
              {"482913".split("").map((d, i) => (
                <span key={i} className="num grid h-12 place-items-center rounded-none border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] text-[22px]">
                  {d}
                </span>
              ))}
            </div>
            <input id="bank-code" className="sr-only" defaultValue="482913" readOnly />
            <button className="btn btn-primary mt-5 w-full" style={{ background: b.color, color: b.ink }}>
              Verify
            </button>
          </form>
        )}

        {stage === "accounts" && (
          <div className="mt-6">
            <fieldset className="space-y-2">
              <legend className="sr-only">Account to pay from</legend>
              {ACCOUNTS.map((a) => (
                <label key={a.id} className="cursor-pointer">
                  <input type="radio" name="acct" className="peer sr-only" checked={account === a.id} onChange={() => setAccount(a.id)} />
                  <span className="flex items-center justify-between gap-3 rounded-none border border-[var(--color-hairline-strong)] px-4 py-3.5 transition-colors peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/6 peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--color-brass)]">
                    <span>
                      <span className="block text-[15px] font-medium">{a.name}</span>
                      <span className="tnum block text-[13px] text-[var(--color-muted)]">••••{a.mask}</span>
                    </span>
                    <span className="text-right">
                      <span className="tnum block text-[15px]">{a.balance}</span>
                      <span className="block text-[12px] text-[var(--color-muted)]">Available</span>
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <p className="mt-4 flex gap-2 text-[13px] text-[var(--color-muted)]">
              <ShieldCheck size={16} className="mt-px shrink-0 text-[var(--color-sage)]" aria-hidden />
              The Club sees only the account name and last four digits. Your sign-in details are never shared.
            </p>
            <button className="btn btn-primary mt-5 w-full" onClick={() => setStage("linking")}>
              Link {acct.kind.toLowerCase()} ••••{acct.mask} <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        )}

        {stage === "linked" && (
          <div className="mt-6" role="status">
            <div className="flex items-center gap-3 rounded-none border border-[var(--color-sage)]/40 bg-[var(--color-sage)]/8 px-4 py-3.5">
              <span className="grid size-8 place-items-center rounded-full bg-[var(--color-sage)] text-white">
                <Check size={17} strokeWidth={3} aria-hidden />
              </span>
              <span>
                <span className="tnum block text-[15px] font-medium">{acct.kind} ••••{acct.mask} linked.</span>
                <span className="block text-[13px] text-[var(--color-muted)]">Orders are paid straight from this account.</span>
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <dt className="text-[var(--color-muted)]">Bank</dt>
              <dd>{b.name}</dd>
              <dt className="text-[var(--color-muted)]">Account</dt>
              <dd className="tnum">{acct.name} ••••{acct.mask}</dd>
              <dt className="text-[var(--color-muted)]">Routing</dt>
              <dd className="tnum">•••••4417</dd>
            </dl>
            <p className="mt-4 text-[12px] text-[var(--color-faint)]">Demo link. No account was connected and no money moves.</p>
            <button onClick={restart} className="btn-text mt-3 text-[13px] text-[var(--color-muted)]">
              Use a different bank
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
