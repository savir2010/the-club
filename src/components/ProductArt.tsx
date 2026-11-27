import { plateImage, type Category } from "@/lib/data";

// Authored placeholder art: one vessel per category, drawn on a tonal plinth.
// Swap for real product photography on plain backgrounds when the client's menu arrives.

const GLASS = "#c9b493";
const GLASS_HI = "#e6d9c2";
const LID = "#3a322a";
const LABEL = "#FAF9F6";
const BRASS = "#111111";

function Label({ x, y, w, h, letter }: { x: number; y: number; w: number; h: number; letter: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={LABEL} />
      <rect x={x} y={y + h - 4} width={w} height={1.2} fill={BRASS} />
      <text
        x={x + w / 2}
        y={y + (h - 4) / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-cormorant), sans-serif"
        fontSize={Math.min(14, h * 0.55)}
        fontWeight={600}
        fill="#111111"
      >
        {letter}
      </text>
    </g>
  );
}

function Vessel({ category, letter }: { category: Category; letter: string }) {
  switch (category) {
    case "Flower":
      return (
        <g>
          <rect x={70} y={78} width={60} height={12} rx={3} fill={LID} />
          <rect x={64} y={90} width={72} height={66} rx={10} fill={GLASS} />
          <rect x={70} y={96} width={5} height={52} rx={2.5} fill={GLASS_HI} />
          <Label x={80} y={110} w={40} h={26} letter={letter} />
        </g>
      );
    case "Pre-rolls":
      return (
        <g>
          <rect x={68} y={70} width={64} height={86} rx={6} fill={GLASS} />
          <rect x={68} y={70} width={64} height={14} rx={6} fill={LID} />
          <rect x={74} y={90} width={4} height={60} rx={2} fill={GLASS_HI} />
          <Label x={80} y={104} w={40} h={32} letter={letter} />
        </g>
      );
    case "Vapes":
      return (
        <g>
          <rect x={92} y={52} width={16} height={14} rx={3} fill={LID} />
          <rect x={88} y={66} width={24} height={64} rx={4} fill={GLASS} />
          <rect x={92} y={70} width={3} height={54} rx={1.5} fill={GLASS_HI} />
          <rect x={90} y={130} width={20} height={26} rx={3} fill={BRASS} opacity={0.85} />
          <rect x={90} y={137} width={20} height={1} fill={LID} opacity={0.6} />
          <Label x={94} y={86} w={12} h={30} letter="" />
        </g>
      );
    case "Edibles":
      return (
        <g>
          <ellipse cx={100} cy={144} rx={46} ry={12} fill={GLASS} />
          <rect x={54} y={116} width={92} height={28} fill={GLASS} />
          <ellipse cx={100} cy={116} rx={46} ry={12} fill={LID} />
          <ellipse cx={100} cy={114} rx={34} ry={8} fill="none" stroke={BRASS} strokeWidth={1} opacity={0.7} />
          <Label x={84} y={124} w={32} h={16} letter={letter} />
        </g>
      );
    case "Concentrates":
      return (
        <g>
          <rect x={74} y={112} width={52} height={10} rx={3} fill={LID} />
          <rect x={72} y={122} width={56} height={34} rx={8} fill={GLASS} />
          <rect x={77} y={126} width={4} height={24} rx={2} fill={GLASS_HI} />
          <Label x={86} y={128} w={28} h={20} letter={letter} />
        </g>
      );
    case "Tinctures":
      return (
        <g>
          <rect x={95} y={40} width={10} height={20} rx={5} fill={LID} />
          <rect x={90} y={58} width={20} height={20} rx={3} fill={LID} />
          <rect x={92} y={76} width={16} height={8} fill={BRASS} opacity={0.8} />
          <rect x={76} y={84} width={48} height={72} rx={10} fill={GLASS} />
          <rect x={81} y={90} width={4} height={58} rx={2} fill={GLASS_HI} />
          <Label x={86} y={104} w={28} h={34} letter={letter} />
        </g>
      );
    case "Topicals":
      return (
        <g>
          <ellipse cx={100} cy={146} rx={40} ry={10} fill={GLASS} />
          <rect x={60} y={128} width={80} height={18} fill={GLASS} />
          <ellipse cx={100} cy={128} rx={40} ry={10} fill={GLASS_HI} />
          <ellipse cx={100} cy={120} rx={40} ry={10} fill={LID} />
          <rect x={60} y={112} width={80} height={8} fill={LID} />
          <ellipse cx={100} cy={112} rx={40} ry={10} fill="#111111" />
          <text
            x={100}
            y={116}
            textAnchor="middle"
            fontFamily="var(--font-cormorant), sans-serif"
            fontSize={13}
            fontWeight={600}
            fill="#ffffff"
          >
            {letter}
          </text>
        </g>
      );
  }
}

export function ProductArt({
  category,
  brand,
  className = "",
  label,
  view = "front",
  image,
}: {
  category: Category;
  brand: string;
  className?: string;
  label?: string;
  /** "front" frames the vessel on its plinth; "close" crops in on the label. */
  view?: "front" | "close";
  /** Product photo. When set its editorial plate (warm ground, 4:5) is shown in place of the drawn vessel. */
  image?: string;
}) {
  if (image) {
    return (
      <span className={`block overflow-hidden bg-[var(--color-plate)] ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plateImage(image)}
          alt=""
          loading="lazy"
          decoding="async"
          className={`size-full object-cover ${view === "close" ? "scale-[1.6]" : ""}`}
        />
      </span>
    );
  }
  const letter = brand.replace("Brand ", "");
  return (
    <svg
      viewBox={view === "close" ? "52 66 96 96" : "28 34 144 144"}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id={`plinth-light`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" style={{ stopColor: "var(--art-plinth-hi, #FAF9F6)" }} />
          <stop offset="100%" style={{ stopColor: "var(--art-plinth-lo, #F3F0E9)" }} />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#plinth-light)" />
      <rect y="156" width="200" height="44" style={{ fill: "var(--art-floor, #e6dbc8)" }} />
      <line x1="0" y1="156" x2="200" y2="156" stroke="#111111" strokeOpacity={0.08} />
      <ellipse cx="100" cy="158" rx="54" ry="5" fill="#5a4426" opacity={0.14} />
      <Vessel category={category} letter={letter} />
    </svg>
  );
}
