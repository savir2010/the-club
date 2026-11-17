import Link from "next/link";

export function Monogram({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="19" fill="none" stroke="var(--color-brass)" strokeWidth="1" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-brass)" strokeWidth="0.5" opacity="0.5" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontFamily="var(--font-manrope), sans-serif"
        fontSize="21"
        fontWeight="500"
        fill="var(--color-ivory)"
      >
        C
      </text>
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3 rounded-md" aria-label="The Club, home">
      <Monogram />
      <span className="display text-[22px] tracking-[0.01em] whitespace-nowrap">The Club</span>
    </Link>
  );
}

export function NoraAvatar({ size = 40, status = false }: { size?: number; status?: boolean }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 overflow-hidden rounded-full ring-1 ring-[var(--color-brass)]/45">
        <NoraFace />
      </span>
      {status && (
        <span
          className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-[var(--color-raised)] bg-[var(--color-sage)]"
          aria-hidden
        />
      )}
    </span>
  );
}

/** Nora's face: her full portrait in the round frame, not zoomed. */
function NoraFace() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/img/nora/nora.jpg" alt="" className="size-full object-cover" draggable={false} aria-hidden />
  );
}
