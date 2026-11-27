// Banks shown in the demo's bank-link step. Logos are supplied by the client
// (public/img/banks) and are trademarks of their owners; the demo connects to none of them.

export type Bank = { id: string; name: string; short: string; src: string; color: string; ink: string };

export const BANKS: Bank[] = [
  { id: "chase", name: "Chase", short: "Chase", src: "/img/banks/chase-bank.png", color: "#117aca", ink: "#ffffff" },
  { id: "bofa", name: "Bank of America", short: "Bank of America", src: "/img/banks/bank-of-america.png", color: "#012169", ink: "#ffffff" },
  { id: "wells", name: "Wells Fargo", short: "Wells Fargo", src: "/img/banks/wellsfargo.png", color: "#d71e28", ink: "#ffffff" },
  { id: "citi", name: "Citi", short: "Citi", src: "/img/banks/citi-bank.png", color: "#056dae", ink: "#ffffff" },
  { id: "capone", name: "Capital One", short: "Capital One", src: "/img/banks/capital-one.png", color: "#004977", ink: "#ffffff" },
  { id: "usbank", name: "U.S. Bank", short: "U.S. Bank", src: "/img/banks/us-bank.png", color: "#0c2074", ink: "#ffffff" },
];

/** The bank's logo on a white tile (white in both themes, so every logo sits on the background it was drawn for). */
export function BankBadge({ bank, size = 44 }: { bank: Bank; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-none bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bank.src} alt="" width={size} height={size} className="size-full object-contain" />
    </span>
  );
}
