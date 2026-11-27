import Link from "next/link";

/** `plain` drops the letter and keeps just the ring (used on formal documents like the trip report). */
export function Monogram({ size = 36, plain = false }: { size?: number; plain?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="19.25" fill="none" stroke="var(--color-ivory)" strokeWidth="0.75" />
      {!plain && (
        <text
          x="20"
          y="27.5"
          textAnchor="middle"
          fontFamily="var(--font-cormorant), 'Cormorant Garamond', serif"
          fontSize="22"
          fontWeight="500"
          fill="var(--color-ivory)"
        >
          C
        </text>
      )}
    </svg>
  );
}

/** The wordmark: tracked Cormorant capitals. No logo tile, no icon. */
export function Wordmark({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="The Club, home">
      <span className="font-[family-name:var(--font-display)] text-[19px] font-medium tracking-[0.32em] whitespace-nowrap uppercase sm:text-[21px]">
        The Club
      </span>
    </Link>
  );
}

export function NoraAvatar({ size = 40, status = false }: { size?: number; status?: boolean }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inset-0 overflow-hidden rounded-full ring-1 ring-[var(--color-hairline-strong)]">
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
    <img src="/img/nora/nora.jpg" alt="" className="size-full object-cover grayscale-[35%]" draggable={false} aria-hidden />
  );
}
