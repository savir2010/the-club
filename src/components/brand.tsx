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

/** Nora's face: a flat-style illustrated avatar, drawn in the house palette. */
function NoraFace() {
  // The round frame around it clips the square art to a circle.
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden>
      <g>
        <rect width="64" height="64" fill="#efdfc5" />
      </g>
      {/* scaled up around the face so she fills the circle */}
      <g transform="translate(32 34) scale(1.28) translate(-32 -34)">
        {/* hair, back */}
        <path d="M16.5 33c0-12.5 6.8-20 15.5-20s15.5 7.5 15.5 20v13.5c0 3-2.2 5.2-5.2 5.2H21.7c-3 0-5.2-2.2-5.2-5.2z" fill="#3b2a20" />
        {/* shoulders */}
        <path d="M11 66c0-12 9.4-19.5 21-19.5S53 54 53 66z" fill="#8d6b3d" />
        <path d="M26.5 46.8 32 53l5.5-6.2z" fill="#f2c9a0" />
        {/* neck and face */}
        <rect x="28" y="37" width="8" height="10" rx="3" fill="#e2b289" />
        <ellipse cx="32" cy="29.5" rx="11" ry="12.5" fill="#f2c9a0" />
        {/* hair, fringe */}
        <path d="M20.6 29.5c.6-9.6 5.6-14.6 11.6-14.6 7 0 11.6 5.4 11.8 13.6-4.6-.8-8.8-3.4-11.2-7.2-2.2 3.8-6.6 7.1-12.2 8.2z" fill="#3b2a20" />
        <circle cx="21.2" cy="33.8" r="1.1" fill="#c9a46a" />
        <circle cx="42.8" cy="33.8" r="1.1" fill="#c9a46a" />
      </g>
    </svg>
  );
}
