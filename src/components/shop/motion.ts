// Small DOM choreography helpers for the scripted concierge actions.
// All of them resolve immediately (no motion) when the visitor prefers reduced motion.

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Press feedback on any element. */
export function press(el: Element | null) {
  if (!el || reducedMotion()) return;
  (el as HTMLElement).animate(
    [{ transform: "scale(1)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }],
    { duration: 260, easing: EASE },
  );
}

/** A little bounce on the header cart once something lands in it. */
export function bumpCart() {
  const cart = document.getElementById("cart-button");
  if (!cart || reducedMotion()) return;
  cart.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.12)", boxShadow: "0 0 0 6px rgb(141 107 61 / 0.18)" },
      { transform: "scale(1)" },
    ],
    { duration: 480, easing: "cubic-bezier(0.34, 1.5, 0.64, 1)" },
  );
}

/** Clones `from` and flies the copy along an arc into the header cart button. */
export async function flyToCart(from: Element | null) {
  const cart = document.getElementById("cart-button");
  if (!from || !cart || reducedMotion()) return;
  const a = from.getBoundingClientRect();
  const b = cart.getBoundingClientRect();
  const ghost = from.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    margin: "0",
    zIndex: "80",
    pointerEvents: "none",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 18px 40px -10px rgb(60 44 20 / 0.35)",
  });
  ghost.removeAttribute("href");
  ghost.setAttribute("aria-hidden", "true");
  document.body.appendChild(ghost);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const lift = Math.min(160, Math.abs(dy) * 0.4 + 60);
  const anim = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      { transform: `translate(0, -12px) scale(1.08) rotate(-4deg)`, opacity: 1, offset: 0.12 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - lift}px) scale(0.6) rotate(8deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(14deg)`, opacity: 0.3, offset: 1 },
    ],
    { duration: 900, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "forwards" },
  );
  await anim.finished.catch(() => {});
  ghost.remove();
  bumpCart();
}
