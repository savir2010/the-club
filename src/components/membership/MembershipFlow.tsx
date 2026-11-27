"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Lock, MessageCircle, ScanLine } from "lucide-react";
import { PERSONA, PLANS } from "@/lib/data";
import { BankLink } from "@/app/join/BankLink";
import { ArizonaCheck, AZ_CHECKS } from "@/app/join/ArizonaCheck";
import { CaptureFrame, Checklist, FailCard, ResultCard, SampleId, useChecks, useDocCheck, verifyDocument, type DocResult } from "@/app/join/Verify";

/*
 * Joining the Club: account, ID, the state eligibility check
 * (AZDHS, simulated), bank, plan. The plan step registers the member's mobile so they can text Nora.
 * Used on its own at /join and inline at checkout, where it is the gate before the order.
 */

const ALL_STEPS = ["Account", "Age and ID", "Arizona check", "Bank", "Plan"] as const;

function Field({ id, label, help, ...rest }: { id: string; label: string; help?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="field" aria-describedby={help ? `${id}-help` : undefined} {...rest} />
      {help && <p id={`${id}-help`} className="field-help">{help}</p>}
    </div>
  );
}

const ID_CHECKS = ["Reading your ID", "Finding your name and date of birth", "Matching them to what you entered", "Checking it hasn't expired", "Confirming your age"];

// What the sample documents say, for presenting without a real card.
const SAMPLE_ID: DocResult = {
  ok: true, problems: [], sample: true,
  fields: { name: "Dana Whitfield", date_of_birth: "April 18, 1991", age: 35, number: "••••4417", expires: "April 18, 2031" },
};
const READ_NOTE = "Read from your photo by AI and checked against what you entered. The photo isn't stored.";
const digits = (s: string) => s.replace(/\D/g, "").slice(-10);
const pretty = (s: string) => {
  const d = digits(s);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s;
};


export function MembershipFlow({
  onDone,
  skipAccount = false,
  signInHref = "/signin",
  compact = false,
}: {
  onDone: () => void;
  /** Already signed in: start at ID. */
  skipAccount?: boolean;
  signInHref?: string;
  /** Smaller headings, for use inside checkout. */
  compact?: boolean;
}) {
  const STEPS = skipAccount ? ALL_STEPS.slice(1) : ALL_STEPS;
  const offset = skipAccount ? 1 : 0;
  const [step, setStep] = useState(0);
  const [bank, setBank] = useState<string | null>(null);
  const onLinked = useCallback((summary: string | null) => setBank(summary), []);
  // ID capture and the simulated check
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [idSample, setIdSample] = useState(false);
  const [idRun, setIdRun] = useState(false);
  const [idResult, setIdResult] = useState<DocResult | null>(null);
  const idCheck = useDocCheck(ID_CHECKS, idRun, idResult);
  const idReady = idSample || !!idFront; // the front has the name and date of birth; the back is optional
  // what the member typed, which the ID must match
  const [fullName, setFullName] = useState("Dana Whitfield");
  const [dob, setDob] = useState("1991-04-18");
  const [plan, setPlan] = useState("Yearly");
  // state eligibility (AZDHS) runs by itself when the step opens
  const [stateRun, setStateRun] = useState(false);
  const stateCheck = useChecks(AZ_CHECKS, stateRun, 900);
  // the mobile number Nora will recognize when they text her
  const [mobile, setMobile] = useState("");
  const [noraNumber, setNoraNumber] = useState("");
  const [finishing, setFinishing] = useState(false);

  const at = step + offset; // index into ALL_STEPS
  useEffect(() => {
    if (at === 2) setStateRun(true);
  }, [at]);
  useEffect(() => {
    fetch("/api/nora/sms/info")
      .then((r) => r.json())
      .then((d) => d.texting && d.nora_number && setNoraNumber(d.nora_number))
      .catch(() => {});
  }, []);
  const canNext =
    at === 1 ? idCheck.passed : at === 2 ? stateCheck.finished : at === 3 ? !!bank : true;

  const runId = async () => {
    setIdRun(true);
    setIdResult(null);
    setIdResult(idSample || !idFront ? SAMPLE_ID : await verifyDocument("id", idFront, fullName, dob));
  };
  const resetId = () => { setIdRun(false); setIdResult(null); };

  const finish = async () => {
    setFinishing(true);
    if (digits(mobile).length === 10) {
      try {
        localStorage.setItem("club-phone", digits(mobile));
      } catch {}
      // register the number so texts from it reach Nora as this member; never block joining on it
      await Promise.race([
        fetch("/api/nora/sms/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: mobile }) }).catch(() => {}),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    }
    onDone();
  };
  const h1 = compact ? "display text-[34px] sm:text-[40px]" : "display text-[44px] sm:text-[52px]";

  return (
    <div className="flex flex-1 flex-col">
      <nav aria-label="Membership progress" className="w-full max-w-[560px]">
        <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}>
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <div className={`h-[3px] rounded-full transition-colors duration-300 ${i <= step ? "bg-[var(--color-brass)]" : "bg-[var(--color-hairline-strong)]"}`} />
              <p className={`mt-2.5 hidden text-[12px] sm:block ${i === step ? "text-[var(--color-ivory)]" : "text-[var(--color-faint)]"}`}>{s}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[13px] text-[var(--color-muted)] sm:hidden">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </nav>

      <div key={step} className="mt-10 w-full max-w-[560px] animate-[fade-up_300ms_var(--ease-out)_both]">
        {at === 0 && (
          <>
            <h1 className={h1}>Create your account</h1>
            <p className="mt-3 text-[var(--color-muted)]">
              We&rsquo;ll use these to confirm your order and text you when it&rsquo;s on its way. Already a member?{" "}
              <Link href={signInHref} className="btn-text">Sign in</Link>
            </p>
            <div className="mt-10 space-y-6">
              <Field id="name" label="Full name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} help="As it appears on your ID." />
              <Field id="email" label="Email" type="email" autoComplete="email" defaultValue="dana.w@example.com" />
              <Field id="mobile" label="Mobile number" type="tel" autoComplete="tel" placeholder="(602) 555-0147" value={mobile} onChange={(e) => setMobile(e.target.value)} help={`${PERSONA.name}, your concierge, will recognize you when you text from this number.`} />
              <Field id="password" label="Create a password" type="password" autoComplete="new-password" defaultValue="clubdemo2026" help="Demo only. Nothing is stored." />
            </div>
          </>
        )}

        {at === 1 && (
          <>
            <h1 className={h1}>Age and ID</h1>
            <p className="mt-3 text-[var(--color-muted)]">Members must be 21 or older. Your driver checks the same ID at the door.</p>
            <div className="mt-10 space-y-8">
              <Field id="dob" label="Date of birth" type="date" value={dob} onChange={(e) => { setDob(e.target.value); resetId(); }} />
              <div className="grid gap-5 sm:grid-cols-2">
                <CaptureFrame
                  id="id-front"
                  label="Front of your ID"
                  image={idFront}
                  onImage={(u) => { setIdFront(u); setIdSample(false); resetId(); }}
                  scanning={idRun && !idCheck.finished}
                  sample={idSample ? <SampleId /> : undefined}
                />
                <CaptureFrame
                  id="id-back"
                  label="Back of your ID (optional)"
                  image={idBack}
                  onImage={(u) => { setIdBack(u); setIdSample(false); resetId(); }}
                  scanning={idRun && !idCheck.finished}
                  sample={idSample ? <SampleId back /> : undefined}
                />
              </div>
              {!idRun && (
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn btn-primary" disabled={!idReady} onClick={runId}>
                    <ScanLine size={17} aria-hidden /> Verify my ID
                  </button>
                  {!idReady && (
                    <button className="btn-text text-[14px] text-[var(--color-muted)]" onClick={() => setIdSample(true)}>
                      Use a sample ID for the demo
                    </button>
                  )}
                </div>
              )}
              {idRun && (
                <div>
                  {!(idCheck.finished && !idResult?.ok) && <Checklist steps={ID_CHECKS} done={idCheck.done} />}
                  {idCheck.finished && idResult && (idResult.ok ? (
                    <ResultCard
                      title="ID verified"
                      rows={[
                        ["Name", idResult.fields?.name ?? "Not readable"],
                        ["Date of birth", idResult.fields?.date_of_birth ?? "Not readable"],
                        ["Age", idResult.fields?.age != null ? `${idResult.fields.age} · 21+ confirmed` : "Not readable"],
                        ["ID number", idResult.fields?.number ?? "Not readable"],
                        ["Expires", idResult.fields?.expires ?? "Not readable"],
                      ]}
                      note={idResult.sample ? "Sample ID for the demo." : READ_NOTE}
                    />
                  ) : (
                    <FailCard title="We couldn't verify this ID" problems={idResult.problems} onRetry={resetId} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {at === 2 && (
          <>
            <h1 className={h1}>Arizona check</h1>
            <p className="mt-3 text-[var(--color-muted)]">
              Arizona requires us to confirm your ID is valid and that you&rsquo;re eligible before your first order. This takes a few seconds.
            </p>
            <ArizonaCheck id={idResult} name={fullName} done={stateCheck.done} />
          </>
        )}

        {at === 3 && (
          <>
            <h1 className={h1}>Link your bank</h1>
            <p className="mt-3 text-[var(--color-muted)]">Orders are paid straight from your checking account. No cards, no cash at the door.</p>
            <div className="mt-10">
              <BankLink onLinked={onLinked} />
            </div>
          </>
        )}

        {at === 4 && (
          <>
            <h1 className={h1}>Choose your plan</h1>
            <p className="mt-3 text-[var(--color-muted)]">Member pricing and free delivery on both. The fee is paid from the bank you just linked.</p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Plan">
              {PLANS.map((p) => (
                <button
                  key={p.name}
                  role="radio"
                  aria-checked={plan === p.name}
                  onClick={() => setPlan(p.name)}
                  className={`rounded-[var(--radius-card)] border p-6 text-left transition-colors ${
                    plan === p.name ? "border-[var(--color-brass)] bg-[var(--color-brass)]/8" : "border-[var(--color-hairline-strong)] hover:border-[var(--color-ivory)]/40"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="display text-[26px]">{p.name}</span>
                    <span className={`grid size-5 place-items-center rounded-full border ${plan === p.name ? "border-[var(--color-brass)] bg-[var(--color-brass)] text-[var(--color-on-brass)]" : "border-[var(--color-hairline-strong)]"}`} aria-hidden>
                      {plan === p.name && <Check size={12} strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="mt-4 flex items-baseline gap-2">
                    <span className="num text-[36px] leading-none">${p.perMonth % 1 ? p.perMonth.toFixed(2) : p.perMonth}</span>
                    <span className="text-[14px] text-[var(--color-muted)]">per month</span>
                  </span>
                  <span className="mt-2 block text-[13px] text-[var(--color-muted)]">{p.billed}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-hairline-strong)] p-5">
              <p className="flex items-center gap-2 text-[15px] font-medium">
                <MessageCircle size={17} strokeWidth={1.6} className="text-[var(--color-brass)]" aria-hidden /> Text {PERSONA.name} anytime
              </p>
              <p className="mt-1 text-[14px] text-[var(--color-muted)]">
                {noraNumber ? `Save ${pretty(noraNumber)} as ${PERSONA.name}. ` : ""}Text her from this number to shop, reorder or check on a delivery. No login needed.
              </p>
              <div className="mt-4 max-w-[280px]">
                <Field id="mobile-text" label="Your mobile number" type="tel" autoComplete="tel" placeholder="(602) 555-0147" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto flex w-full max-w-[560px] items-center justify-between gap-4 pt-12">
        {step > 0 ? (
          <button
            className="btn btn-text text-[15px]"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          className="btn btn-lg btn-primary min-w-[180px]"
          disabled={!canNext || finishing}
          onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}
        >
          {step === STEPS.length - 1 ? (
            <>
              <Lock size={16} aria-hidden /> Start membership
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
