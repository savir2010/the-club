import { money } from "@/lib/data";

// The member ledger: retail struck through, member price in quiet tabular figures,
// optional bundle price. Used identically everywhere a price appears.
export function Ledger({
  retail,
  member,
  bundle,
  size = "md",
  align = "start",
}: {
  retail: number;
  member: number;
  bundle?: number;
  size?: "sm" | "md" | "lg";
  align?: "start" | "end";
}) {
  const big = size === "lg" ? "text-[22px]" : size === "md" ? "text-[17px]" : "text-[15px]";
  return (
    <div className={`flex flex-col ${align === "end" ? "items-end text-right" : ""}`}>
      <div className="flex items-baseline gap-2">
        <span className="tnum text-[12px] text-[var(--color-muted)] line-through decoration-[var(--color-muted)]/70">
          <span className="sr-only">Retail price </span>
          {money(retail)}
        </span>
        <span
          className={`num ${big} leading-none text-[var(--color-brass)] ${bundle ? "line-through decoration-1 opacity-70" : ""}`}
        >
          <span className="sr-only">Member price </span>
          {money(member)}
        </span>
      </div>
      {bundle !== undefined && (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[12px] text-[var(--color-muted)]">Bundle, each</span>
          <span className={`num ${big} leading-none text-[var(--color-brass-hi)]`}>{money(bundle)}</span>
        </div>
      )}
    </div>
  );
}
