"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Check, Lock, ScanLine, Stethoscope, Upload } from "lucide-react";
import { BankLink } from "@/app/join/BankLink";
import { CaptureFrame, Checklist, ResultCard, SampleId, SampleMedCard, useChecks } from "@/app/join/Verify";

/*
 * Joining the Club: account, ID, medical card (or a telehealth visit), bank, plan.
 * Used on its own at /join and inline at checkout, where it is the gate before the order.
 */

const ALL_STEPS = ["Account", "Age and ID", "Medical card", "Bank", "Plan"] as const;

function Field({ id, label, help, ...rest }: { id: string; label: string; help?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="field" aria-describedby={help ? `${id}-help` : undefined} {...rest} />
      {help && <p id={`${id}-help`} className="field-help">{help}</p>}
    </div>
  );
}

const ID_CHECKS = ["Reading the front of your ID", "Reading the barcode on the back", "Checking it hasn't expired", "Matching your date of birth", "Confirming you're 21 or older"];
const CARD_CHECKS = ["Reading your card", "Checking the card number", "Checking it's still valid", "Matching the name to your ID"];
const CLINICIANS = [
  { name: "Lena Ortiz, NP", note: "Usually replies within the hour" },
  { name: "Dr. Sam Okafor", note: "Evening visits" },
];


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
  const [med, setMed] = useState<"none" | "upload" | "telehealth">("none");
  const [booked, setBooked] = useState(false);
  const [bank, setBank] = useState<string | null>(null);
  const onLinked = useCallback((summary: string | null) => setBank(summary), []);
  // ID capture and the simulated check
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [idSample, setIdSample] = useState(false);
  const [idRun, setIdRun] = useState(false);
  const idCheck = useChecks(ID_CHECKS, idRun);
  const idReady = idSample || (!!idFront && !!idBack);
  // medical card capture and the simulated check
  const [card, setCard] = useState<string | null>(null);
  const [cardSample, setCardSample] = useState(false);
  const [cardRun, setCardRun] = useState(false);
  const cardCheck = useChecks(CARD_CHECKS, cardRun);
  const [clinician, setClinician] = useState(CLINICIANS[0].name);
  const [plan, setPlan] = useState("Yearly");

  const at = step + offset; // index into ALL_STEPS
  const canNext =
    at === 1 ? idCheck.finished : at === 2 ? (med === "upload" && cardCheck.finished) || booked : at === 3 ? !!bank : true;
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
              <Field id="name" label="Full name" autoComplete="name" defaultValue="Dana Whitfield" />
              <Field id="email" label="Email" type="email" autoComplete="email" defaultValue="dana.w@example.com" />
              <Field id="mobile" label="Mobile number" type="tel" autoComplete="tel" defaultValue="(602) 555-0147" help="Your concierge can text you here." />
              <Field id="password" label="Create a password" type="password" autoComplete="new-password" defaultValue="clubdemo2026" help="Demo only. Nothing is stored." />
            </div>
          </>
        )}

        {at === 1 && (
          <>
            <h1 className={h1}>Age and ID</h1>
            <p className="mt-3 text-[var(--color-muted)]">Members must be 21+, or 18+ with an Arizona medical card. Your driver checks the same ID at the door.</p>
            <div className="mt-10 space-y-8">
              <Field id="dob" label="Date of birth" type="date" defaultValue="1991-04-18" />
              <div className="grid gap-5 sm:grid-cols-2">
                <CaptureFrame
                  id="id-front"
                  label="Front of your ID"
                  image={idFront}
                  onImage={(u) => { setIdFront(u); setIdSample(false); setIdRun(false); }}
                  scanning={idRun && !idCheck.finished}
                  sample={idSample ? <SampleId /> : undefined}
                />
                <CaptureFrame
                  id="id-back"
                  label="Back of your ID"
                  image={idBack}
                  onImage={(u) => { setIdBack(u); setIdSample(false); setIdRun(false); }}
                  scanning={idRun && !idCheck.finished}
                  sample={idSample ? <SampleId back /> : undefined}
                />
              </div>
              {!idRun && (
                <div className="flex flex-wrap items-center gap-4">
                  <button className="btn btn-primary" disabled={!idReady} onClick={() => setIdRun(true)}>
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
                  <Checklist steps={ID_CHECKS} done={idCheck.done} />
                  {idCheck.finished && (
                    <ResultCard
                      title="ID verified"
                      rows={[
                        ["Name", "Dana Whitfield"],
                        ["Date of birth", "April 18, 1991"],
                        ["Age", "35 · 21+ confirmed"],
                        ["ID number", "••••4417 21"],
                        ["Expires", "April 18, 2031"],
                      ]}
                      note="Simulated check. Photos stay in this tab and are never uploaded."
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {at === 2 && !booked && (
          <>
            <h1 className={h1}>Medical card</h1>
            <p className="mt-3 text-[var(--color-muted)]">Optional if you&rsquo;re 21 or older. Required from 18 to 20.</p>
            <fieldset className="mt-10 grid gap-3">
              <legend className="sr-only">Do you have an Arizona medical card?</legend>
              {[
                { v: "upload" as const, title: "Upload my card", body: "I have an Arizona medical marijuana card.", icon: Upload },
                { v: "telehealth" as const, title: "Book a telehealth visit", body: "I don't have one. Talk to a clinician from home.", icon: Stethoscope },
              ].map(({ v, title, body, icon: Icon }) => (
                <label key={v} className="cursor-pointer">
                  <input type="radio" name="med" className="peer sr-only" checked={med === v} onChange={() => setMed(v)} />
                  <span className="flex items-start gap-4 rounded-[var(--radius-card)] border border-[var(--color-hairline-strong)] p-5 transition-colors hover:border-[var(--color-ivory)]/40 peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/8 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brass)]">
                    <Icon size={20} strokeWidth={1.4} className="mt-0.5 shrink-0 text-[var(--color-brass)]" aria-hidden />
                    <span>
                      <span className="block text-[16px] font-medium">{title}</span>
                      <span className="mt-0.5 block text-[14px] text-[var(--color-muted)]">{body}</span>
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            {med === "upload" && (
              <div className="mt-8 max-w-[420px]">
                <CaptureFrame
                  id="card-upload"
                  label="Front of your medical card"
                  image={card}
                  onImage={(u) => { setCard(u); setCardSample(false); setCardRun(false); }}
                  scanning={cardRun && !cardCheck.finished}
                  sample={cardSample ? <SampleMedCard /> : undefined}
                />
                {!cardRun && (
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <button className="btn btn-primary" disabled={!card && !cardSample} onClick={() => setCardRun(true)}>
                      <ScanLine size={17} aria-hidden /> Verify my card
                    </button>
                    {!card && !cardSample && (
                      <button className="btn-text text-[14px] text-[var(--color-muted)]" onClick={() => setCardSample(true)}>
                        Use a sample card for the demo
                      </button>
                    )}
                  </div>
                )}
                {cardRun && (
                  <>
                    <Checklist steps={CARD_CHECKS} done={cardCheck.done} />
                    {cardCheck.finished && (
                      <ResultCard
                        title="Medical card on file"
                        rows={[
                          ["Patient", "Dana Whitfield"],
                          ["Card number", "••••4821"],
                          ["Expires", "September 30, 2027"],
                          ["Status", "Active"],
                        ]}
                        note="Simulated check. No state registry was contacted."
                      />
                    )}
                  </>
                )}
              </div>
            )}
            {med === "telehealth" && (
              <div className="mt-8 space-y-6">
                <fieldset>
                  <legend className="field-label">Choose a clinician</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {CLINICIANS.map((c) => (
                      <label key={c.name} className="cursor-pointer">
                        <input type="radio" name="clin" className="peer sr-only" checked={clinician === c.name} onChange={() => setClinician(c.name)} />
                        <span className="flex items-center gap-3 rounded-[12px] border border-[var(--color-hairline-strong)] p-3.5 peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/8 peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--color-brass)]">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-raised-2)] text-[14px] font-semibold">
                            {c.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <span>
                            <span className="block text-[14px] font-medium">{c.name}</span>
                            <span className="block text-[12px] text-[var(--color-muted)]">{c.note}</span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <p className="field-label">Choose a time</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Today 4:30 PM", "Today 6:00 PM", "Tomorrow 9:15 AM"].map((t, i) => (
                      <label key={t} className="cursor-pointer">
                        <input type="radio" name="tele" defaultChecked={i === 1} className="peer sr-only" />
                        <span className="tnum flex h-12 items-center justify-center rounded-[10px] border border-[var(--color-hairline-strong)] text-center text-[13px] peer-checked:border-[var(--color-brass)] peer-checked:bg-[var(--color-brass)]/10 peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--color-brass)]">
                          {t}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setBooked(true)}>Request visit</button>
              </div>
            )}
          </>
        )}

        {at === 2 && booked && (
          <div className="pt-6">
            <span className="grid size-14 place-items-center rounded-full border border-[var(--color-brass)]/60 text-[var(--color-brass)]">
              <Check size={24} aria-hidden />
            </span>
            <h1 className={`${h1} mt-6`}>Visit requested</h1>
            <p className="mt-4 max-w-[44ch] text-[17px] text-[var(--color-ivory)]/90">
              A clinician will review your request and reply by text.
            </p>
            <p className="mt-2 text-[14px] text-[var(--color-muted)]">{clinician} · Today, 6:00 PM · Demo booking, no real appointment was made.</p>
          </div>
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
            <p className="mt-3 text-[var(--color-muted)]">Member pricing and free delivery on both. The fee is paid from the bank you just linked. Fees are set before launch.</p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Plan">
              {[
                { name: "Monthly", note: "Billed each month" },
                { name: "Yearly", note: "Billed once a year" },
              ].map((p) => (
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
                    <span className="num text-[36px] leading-none">$__</span>
                    <span className="text-[14px] text-[var(--color-muted)]">per month</span>
                  </span>
                  <span className="mt-2 block text-[13px] text-[var(--color-muted)]">{p.note}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-auto flex w-full max-w-[560px] items-center justify-between gap-4 pt-12">
        {step > 0 ? (
          <button
            className="btn btn-text text-[15px]"
            onClick={() => {
              if (at === 2 && booked) setBooked(false);
              else setStep(step - 1);
            }}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          className="btn btn-lg btn-primary min-w-[180px] rounded-full"
          disabled={!canNext}
          onClick={() => (step === STEPS.length - 1 ? onDone() : setStep(step + 1))}
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
