import { Star } from "lucide-react";

/** Five stars with a partial fill for the rating. */
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="relative inline-flex" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <span className="flex text-[var(--color-brass)]/25">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden text-[var(--color-brass)]" style={{ width: `${(rating / 5) * 100}%` }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}
