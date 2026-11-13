/**
 * Slow-moving beige and brass aurora, drawn with soft radial light only.
 * Pure CSS (transform animations on gradient layers), so it stays cheap without a GPU.
 * Fills its parent; the parent sets size and shape.
 */
export function Aurora({ className = "", calm = false }: { className?: string; calm?: boolean }) {
  return (
    <span className={`aurora ${calm ? "aurora-calm" : ""} ${className}`} aria-hidden>
      <span className="aurora-a" />
      <span className="aurora-b" />
      <span className="aurora-c" />
      <span className="aurora-d" />
    </span>
  );
}
