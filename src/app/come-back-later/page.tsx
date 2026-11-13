import { Monogram } from "@/components/brand";
import { SiteFooter } from "@/components/SiteChrome";

export default function ComeBackLater() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="container-club grid flex-1 place-items-center py-24 text-center">
        <div>
          <div className="mx-auto mb-8 w-fit opacity-80">
            <Monogram size={44} />
          </div>
          <h1 className="display text-[44px] sm:text-[56px]">Come back when you&rsquo;re 21.</h1>
          <p className="mx-auto mt-5 max-w-[42ch] text-[var(--color-muted)]">
            The Club is only for adults 21 and older, or 18 and older with a valid Arizona medical
            marijuana card.
          </p>
        </div>
      </main>
      <SiteFooter compact />
    </div>
  );
}
