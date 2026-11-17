"use client";

import { Check, Landmark } from "lucide-react";
import { type DocResult } from "./Verify";

/** The mock Arizona validity check. Each line of the state record fills in as its check finishes. */
export const AZ_CHECKS = [
  "Contacting Arizona MVD",
  "Checking the ID is valid and not reported lost or stolen",
  "Matching your name and date of birth to state records",
  "Confirming adult-use eligibility under Prop 207 (21+)",
  "Checking today's purchase limit",
];

export function arizonaRef(id: DocResult | null) {
  const seed = (id?.fields?.number ?? "4417").replace(/\D/g, "").slice(-4) || "4417";
  return `AZ-ELG-${seed}-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}`;
}

export function ArizonaCheck({ id, name, done }: { id: DocResult | null; name: string; done: number }) {
  const f = id?.fields ?? {};
  const finished = done >= AZ_CHECKS.length;
  // one result line per check, in the same order as AZ_CHECKS
  const results: [string, string][] = [
    ["Connected", "Arizona MVD and Dept. of Health Services"],
    ["ID status", `Valid · ${f.number ?? "on file"} · expires ${f.expires ?? "later"}`],
    ["Identity", `${f.name ?? name} · born ${f.date_of_birth ?? "on file"} · match`],
    ["Eligibility", `Adult use · age ${f.age ?? "21+"}`],
    ["Purchase limit", "1 oz per order, up to 5 g concentrate · none used today"],
  ];

  return (
    <div
      data-az-check
      className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-hairline-strong)] bg-[var(--color-raised)]"
    >
      <div className="flex items-center gap-4 border-b border-[var(--color-hairline)] p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-raised-2)] text-[var(--color-brass)]">
          <Landmark size={20} strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">State of Arizona · eligibility lookup</p>
          <p className="truncate text-[13px] text-[var(--color-muted)]">
            Arizona MVD and Dept. of Health Services · {f.name ?? name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] uppercase transition-colors ${
            finished ? "bg-[var(--color-sage)] text-white" : "bg-[var(--color-raised-2)] text-[var(--color-muted)]"
          }`}
        >
          {finished ? "Valid" : "Checking"}
        </span>
      </div>

      <ol className="divide-y divide-[var(--color-hairline)]" role="status" aria-live="polite">
        {AZ_CHECKS.map((step, i) => {
          const ok = i < done;
          const now = i === done;
          return (
            <li key={step} className="grid grid-cols-[20px_1fr] gap-3 px-5 py-3.5">
              <span
                className={`mt-0.5 grid size-5 place-items-center rounded-full border transition-colors ${
                  ok ? "border-[var(--color-sage)] bg-[var(--color-sage)] text-white" : "border-[var(--color-hairline-strong)]"
                }`}
              >
                {ok ? <Check size={12} strokeWidth={3} aria-hidden /> : now ? <span className="size-1.5 animate-pulse rounded-full bg-[var(--color-brass)]" /> : null}
              </span>
              <div className={`text-[14px] transition-colors ${ok || now ? "" : "text-[var(--color-faint)]"}`}>
                <p>{step}</p>
                {ok && (
                  <p className="mt-0.5 animate-[fade-up_250ms_var(--ease-out)_both] text-[13px] text-[var(--color-muted)]">
                    <span className="text-[var(--color-ivory)]">{results[i][0]}:</span> {results[i][1]}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {finished && (
        <div className="animate-[fade-up_300ms_var(--ease-out)_both] border-t border-[var(--color-hairline)] bg-[var(--color-raised-2)] px-5 py-4">
          <p className="flex items-center gap-2 text-[15px] font-medium">
            <span className="grid size-6 place-items-center rounded-full bg-[var(--color-sage)] text-white">
              <Check size={14} strokeWidth={3} aria-hidden />
            </span>
            Eligible to buy in Arizona
          </p>
          <p className="mt-2 text-[13px] text-[var(--color-muted)]">
            Reference <span className="tnum text-[var(--color-ivory)]">{arizonaRef(id)}</span> · checked{" "}
            {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
          <p className="mt-2 text-[12px] text-[var(--color-faint)]">Mock check for the demo. No Arizona agency was contacted.</p>
        </div>
      )}
    </div>
  );
}
