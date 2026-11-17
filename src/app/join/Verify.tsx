"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, Check, RotateCcw, ScanLine, Upload } from "lucide-react";

/* ------------------------------------------------------------------
   Document capture: a card-shaped frame with corner guides. Any image
   works; it is shown only in this tab and never uploaded or saved.
   ------------------------------------------------------------------ */

function Corners() {
  const c = "absolute size-6 border-[var(--color-brass)]";
  return (
    <>
      <span className={`${c} top-3 left-3 rounded-tl-[10px] border-t-2 border-l-2`} />
      <span className={`${c} top-3 right-3 rounded-tr-[10px] border-t-2 border-r-2`} />
      <span className={`${c} bottom-3 left-3 rounded-bl-[10px] border-b-2 border-l-2`} />
      <span className={`${c} right-3 bottom-3 rounded-br-[10px] border-r-2 border-b-2`} />
    </>
  );
}

export function CaptureFrame({
  id,
  label,
  image,
  onImage,
  scanning = false,
  sample,
}: {
  id: string;
  label: string;
  image: string | null;
  onImage: (url: string | null) => void;
  scanning?: boolean;
  sample?: React.ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (f?: File) => f && f.type.startsWith("image/") && onImage(URL.createObjectURL(f));

  return (
    <div>
      <p className="field-label" id={`${id}-label`}>{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={`relative aspect-[1.586] w-full overflow-hidden rounded-[16px] border transition-colors ${
          over ? "border-[var(--color-brass)] bg-[var(--color-brass)]/6" : image ? "border-[var(--color-hairline-strong)]" : "border-dashed border-[var(--color-hairline-strong)] bg-[var(--color-raised)]"
        }`}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : sample ? (
          <div className="absolute inset-0">{sample}</div>
        ) : null}

        {!image && !sample && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <Camera size={26} strokeWidth={1.3} className="text-[var(--color-muted)]" aria-hidden />
            <p className="mt-3 text-[14px]">Place the card inside the frame</p>
            <p className="mt-1 text-[12px] text-[var(--color-muted)]">Flat, in good light, all four corners showing</p>
            <button className="btn btn-sm btn-outline mt-4" onClick={() => input.current?.click()} aria-describedby={`${id}-label`}>
              <Upload size={15} aria-hidden /> Upload a photo
            </button>
          </div>
        )}

        <Corners />
        {scanning && (
          <span className="scan-line pointer-events-none absolute inset-x-4 h-[2px] rounded-full bg-[var(--color-brass)] shadow-[0_0_16px_4px_rgb(141_107_61/0.45)]" aria-hidden />
        )}
        <input ref={input} id={id} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => take(e.target.files?.[0])} />
      </div>
      {(image || sample) && !scanning && (
        <button
          className="btn-text mt-2 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-muted)]"
          onClick={() => {
            onImage(null);
            input.current?.click();
          }}
        >
          <RotateCcw size={13} aria-hidden /> Retake
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Reading a real photo: the agent reads the card (OCR + Claude) and
   plain code checks name, date of birth, age and expiry.
   ------------------------------------------------------------------ */

export type DocResult = {
  ok: boolean;
  problems: string[];
  under_21?: boolean;
  fields?: { name?: string | null; date_of_birth?: string; age?: number | null; number?: string; expires?: string; issuer?: string | null; marked_sample?: boolean };
  sample?: boolean;
};

/** Shrinks a photo to a sensible size for reading, as a JPEG data URL. */
async function toDataUrl(src: string, max = 1600): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.88);
}

export async function verifyDocument(kind: "id" | "medical", photo: string, name: string, dob = ""): Promise<DocResult> {
  try {
    const image = await toDataUrl(photo);
    const r = await fetch("/api/nora/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, image, name, dob }),
    });
    const d = await r.json();
    return r.ok ? d : { ok: false, problems: [d.message || "The card couldn't be read right now. Try again."] };
  } catch {
    return { ok: false, problems: ["The card couldn't be read right now. Try again."] };
  }
}

/** Like useChecks, but holds on the last check until the real result is in. */
export function useDocCheck(steps: string[], running: boolean, result: DocResult | null, msEach = 600) {
  const [n, setN] = useState(0);
  const cap = result ? steps.length : steps.length - 1;
  useEffect(() => {
    if (!running) {
      setN(0);
      return;
    }
    if (n >= cap) return;
    const t = setTimeout(() => setN((x) => x + 1), msEach);
    return () => clearTimeout(t);
  }, [running, n, cap, msEach]);
  const finished = running && !!result && n >= steps.length;
  return { done: n, finished, passed: finished && !!result?.ok };
}

export function FailCard({ title, problems, onRetry }: { title: string; problems: string[]; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-5 animate-[fade-up_300ms_var(--ease-out)_both] rounded-[var(--radius-card)] border border-[var(--color-clay)]/45 bg-[var(--color-raised)] p-5">
      <p className="flex items-center gap-2 text-[15px] font-medium">
        <AlertCircle size={20} className="text-[var(--color-clay)]" aria-hidden />
        {title}
      </p>
      <ul className="mt-3 space-y-1.5 text-[14px] leading-snug">
        {problems.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <button className="btn btn-sm btn-outline mt-4" onClick={onRetry}>
        <RotateCcw size={14} aria-hidden /> Try again
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
   Verification checklist: ticks through its checks, then reports.
   ------------------------------------------------------------------ */

export function useChecks(steps: string[], running: boolean, msEach = 650) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!running) {
      setN(0);
      return;
    }
    if (n >= steps.length) return;
    const t = setTimeout(() => setN((x) => x + 1), msEach);
    return () => clearTimeout(t);
  }, [running, n, steps.length, msEach]);
  return { done: n, finished: running && n >= steps.length };
}

export function Checklist({ steps, done }: { steps: string[]; done: number }) {
  return (
    <ul className="mt-5 space-y-2.5" role="status" aria-live="polite">
      {steps.map((s, i) => (
        <li key={s} className={`flex items-center gap-3 text-[14px] transition-colors ${i < done ? "" : i === done ? "text-[var(--color-ivory)]" : "text-[var(--color-faint)]"}`}>
          <span
            className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
              i < done ? "border-[var(--color-sage)] bg-[var(--color-sage)] text-white" : "border-[var(--color-hairline-strong)]"
            }`}
          >
            {i < done ? <Check size={12} strokeWidth={3} aria-hidden /> : i === done ? <span className="size-1.5 animate-pulse rounded-full bg-[var(--color-brass)]" /> : null}
          </span>
          {s}
        </li>
      ))}
    </ul>
  );
}

export function ResultCard({ title, rows, note }: { title: string; rows: [string, string][]; note: string }) {
  return (
    <div className="mt-5 animate-[fade-up_300ms_var(--ease-out)_both] rounded-[var(--radius-card)] border border-[var(--color-sage)]/40 bg-[var(--color-raised)] p-5">
      <p className="flex items-center gap-2 text-[15px] font-medium">
        <span className="grid size-6 place-items-center rounded-full bg-[var(--color-sage)] text-white">
          <Check size={14} strokeWidth={3} aria-hidden />
        </span>
        {title}
      </p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-[var(--color-muted)]">{k}</dt>
            <dd className="tnum">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-center gap-1.5 text-[12px] text-[var(--color-faint)]">
        <ScanLine size={13} aria-hidden /> {note}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------
   Sample documents, for presenting without a real card. Generic
   layouts marked SAMPLE; they copy no real state's design.
   ------------------------------------------------------------------ */

export function SampleId({ back = false }: { back?: boolean }) {
  if (back) {
    return (
      <div className="flex size-full flex-col justify-between bg-[linear-gradient(135deg,#f3ede2,#e6dccb)] p-[6%]">
        <div className="h-[18%] rounded-[4px] bg-[repeating-linear-gradient(90deg,#2b261f_0_2px,transparent_2px_5px,#2b261f_5px_6px,transparent_6px_9px)] opacity-80" />
        <div className="space-y-[3%]">
          {[90, 72, 84].map((w) => (
            <div key={w} className="h-[5px] rounded bg-[#2b261f]/15" style={{ width: `${w}%` }} />
          ))}
        </div>
        <p className="text-[10px] tracking-[0.2em] text-[#2b261f]/50">SAMPLE · NOT A VALID ID</p>
      </div>
    );
  }
  return (
    <div className="relative size-full bg-[linear-gradient(135deg,#f6f0e4,#e9dcc3)] p-[5.5%] text-[#2b261f]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-[0.18em]">IDENTIFICATION CARD</p>
        <p className="rounded-[4px] bg-[#8d6b3d] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.15em] text-white">SAMPLE</p>
      </div>
      <div className="mt-[5%] flex gap-[5%]">
        <div className="aspect-[3/4] w-[28%] rounded-[6px] bg-[linear-gradient(180deg,#d8c7aa,#bfa985)]">
          <svg viewBox="0 0 30 40" className="size-full opacity-60" aria-hidden>
            <circle cx="15" cy="15" r="7" fill="#8d6b3d" />
            <path d="M3 40c1-9 6-13 12-13s11 4 12 13z" fill="#8d6b3d" />
          </svg>
        </div>
        <dl className="grid flex-1 grid-cols-2 content-start gap-x-3 gap-y-[2%] text-[10px] leading-tight">
          <div className="col-span-2">
            <dt className="text-[8px] tracking-[0.12em] opacity-60">NAME</dt>
            <dd className="text-[13px] font-semibold">WHITFIELD, DANA</dd>
          </div>
          <div>
            <dt className="text-[8px] tracking-[0.12em] opacity-60">DOB</dt>
            <dd className="font-semibold">04/18/1991</dd>
          </div>
          <div>
            <dt className="text-[8px] tracking-[0.12em] opacity-60">EXPIRES</dt>
            <dd className="font-semibold">04/18/2031</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[8px] tracking-[0.12em] opacity-60">ID NO.</dt>
            <dd className="font-semibold tracking-[0.08em]">D0000 4417 21</dd>
          </div>
        </dl>
      </div>
      <p className="absolute bottom-[4%] left-[5.5%] text-[8px] tracking-[0.18em] opacity-50">DEMO DOCUMENT · NOT VALID FOR ID</p>
    </div>
  );
}

export function SampleMedCard() {
  return (
    <div className="relative size-full bg-[linear-gradient(135deg,#eef3ee,#d9e4da)] p-[5.5%] text-[#21302a]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-[0.16em]">MEDICAL MARIJUANA PATIENT CARD</p>
        <p className="rounded-[4px] bg-[#2e5b4f] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.15em] text-white">SAMPLE</p>
      </div>
      <dl className="mt-[7%] grid grid-cols-2 gap-x-4 gap-y-[6%] text-[10px] leading-tight">
        <div className="col-span-2">
          <dt className="text-[8px] tracking-[0.12em] opacity-60">PATIENT</dt>
          <dd className="text-[13px] font-semibold">DANA WHITFIELD</dd>
        </div>
        <div>
          <dt className="text-[8px] tracking-[0.12em] opacity-60">CARD NO.</dt>
          <dd className="font-semibold tracking-[0.08em]">MM-0000-4821</dd>
        </div>
        <div>
          <dt className="text-[8px] tracking-[0.12em] opacity-60">EXPIRES</dt>
          <dd className="font-semibold">09/30/2027</dd>
        </div>
      </dl>
      <p className="absolute bottom-[5%] left-[5.5%] text-[9px] tracking-[0.2em] opacity-50">DEMO DOCUMENT · NOT ISSUED BY ANY STATE</p>
    </div>
  );
}
