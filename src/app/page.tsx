import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { NoraAvatar } from "@/components/brand";
import { money, PLANS, PRODUCTS } from "@/lib/data";
import { LandingBackground, RevealOnScroll } from "@/components/LandingMotion";
import { ProductCard } from "@/components/shop/ProductCard";

const STEPS = [
  {
    title: "Text or talk to your concierge",
    body: "Say what the evening calls for, in your own words. No menu to decode.",
  },
  {
    title: "Approve your cart with one tap",
    body: "Retail and member prices side by side, delivery included. Change anything first.",
  },
  {
    title: "A licensed courier delivers it",
    body: "Your driver checks ID at the door. Track the car from the moment it leaves.",
  },
];

const BENEFITS = [
  { title: "Member pricing on every item", body: "Every product, every order, at the member price." },
  { title: "Free delivery", body: "No delivery fee on any order. Tip your driver if you like." },
  { title: "Subscribe & Save on your staples", body: "Put favorites on repeat, every 1 to 8 weeks, for up to 10% more off. Skip or cancel anytime." },
  { title: "A concierge who knows your taste", body: "Nora remembers what you like and reorders in one message." },
];

const ROMAN = ["I", "II", "III"];

export default function Home() {
  // four house products, one per category where possible, for the shelf preview
  const shelf = ["Flower", "Edibles", "Vapes", "Concentrates"]
    .map((c) => PRODUCTS.find((p) => p.category === c && p.house_brand && p.in_stock) ?? PRODUCTS.find((p) => p.category === c))
    .filter((p): p is (typeof PRODUCTS)[number] => !!p);

  return (
    <div className="relative isolate">
      <LandingBackground />
      <RevealOnScroll />
      <SiteHeader variant="overlay" />
      <main>
        {/* Hero: the estate on film. The headline sits top left in the open sky of the shot; the invitation stays low. */}
        <section className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden text-[#FAF9F6]">
          {/* local shades only: one behind the headline, a lighter one behind the invitation, so the film keeps its colour */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_52%_at_12%_22%,rgb(17_17_17/0.55)_0%,rgb(17_17_17/0.26)_50%,rgb(17_17_17/0)_80%),radial-gradient(ellipse_60%_40%_at_14%_92%,rgb(17_17_17/0.5)_0%,rgb(17_17_17/0)_75%)] max-sm:bg-[linear-gradient(180deg,rgb(17_17_17/0.55)_0%,rgb(17_17_17/0.2)_42%,rgb(17_17_17/0.1)_60%,rgb(17_17_17/0.6)_100%)]"
            style={{ opacity: "calc(1 - var(--hero-out, 0) * 1.6)" }}
            aria-hidden
          />
          <div
            className="container-club relative flex flex-1 flex-col justify-between pt-[calc(84px+7svh)] pb-[12svh] sm:pb-[14svh]"
            style={{
              opacity: "calc(1 - var(--hero-out, 0) * 1.6)",
              transform: "translateY(calc(var(--hero-out, 0) * -56px))",
            }}
          >
            <h1 className="display max-w-[14ch] text-[clamp(52px,8.6vw,124px)] leading-[0.96] tracking-[-0.02em]">
              <span className="rise" style={{ ["--i" as string]: 0 }}><span>Your personal</span></span>
              <span className="rise" style={{ ["--i" as string]: 1 }}><span>cannabis concierge</span></span>
            </h1>
            <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,38ch)_auto] md:items-end md:justify-between">
              <p className="max-w-[38ch] animate-[fade-up_1100ms_var(--ease-out)_620ms_both] text-[16px] leading-[1.65] text-[#FAF9F6]/85 sm:text-[17px]">
                Tell us what you want. We bring it to your door. Browse the whole shelf, then join when you check out.
              </p>
              <div className="flex animate-[fade-up_1100ms_var(--ease-out)_780ms_both] flex-wrap items-center gap-x-9 gap-y-4">
                <Link href="/shop" data-hero-action className="btn btn-lg bg-[#FAF9F6] text-[#111111] before:bg-[#C9C1B6]">
                  Start shopping
                </Link>
                <Link href="/signin" className="btn-text smallcaps text-[#FAF9F6]">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
          <div
            className="smallcaps absolute right-5 bottom-8 hidden items-center gap-4 text-[#FAF9F6]/70 md:right-12 md:flex xl:right-[72px]"
            style={{ opacity: "calc(1 - var(--hero-out, 0) * 4)" }}
            aria-hidden
          >
            <span>Scroll</span>
            <span className="relative h-12 w-px overflow-hidden bg-[#FAF9F6]/25">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-[#FAF9F6] motion-safe:animate-[scroll-cue_2.4s_var(--ease-out)_infinite]" />
            </span>
          </div>
        </section>

        {/* Statement */}
        <section aria-label="About the Club" className="bg-[var(--color-canvas)]">
          <div data-reveal className="container-club py-28 sm:py-40">
            <p data-reveal-child className="display mx-auto max-w-[22ch] text-center text-[34px] leading-[1.18] sm:text-[52px]">
              A members&rsquo; club for the evening, with a concierge who knows the shelf by heart.
            </p>
            <div data-reveal-child style={{ ["--i" as string]: 1 }} className="mt-12 flex justify-center">
              <Link href="/shop" className="btn-text smallcaps">Discover the shelf</Link>
            </div>
          </div>
        </section>

        {/* The shelf: four products, the same plate and proportion */}
        <section aria-labelledby="shelf" className="bg-[var(--color-canvas)]">
          <div data-reveal className="container-club pb-28 sm:pb-40">
            <div className="flex items-end justify-between gap-6 border-t border-[var(--color-hairline)] pt-8">
              <h2 id="shelf" className="display text-[32px] sm:text-[40px]">From the house</h2>
              <Link href="/shop" className="nav-link smallcaps">View all</Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
              {shelf.map((p, i) => (
                <li key={p.id} data-reveal-child style={{ ["--i" as string]: i }} className="flex">
                  <ProductCard p={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-8 bg-[var(--color-cream)]">
          <div data-reveal className="container-club grid gap-16 py-28 sm:py-40 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="how-title" data-reveal-child className="display text-[40px] sm:text-[56px]">
                How it works
              </h2>
              <p data-reveal-child style={{ ["--i" as string]: 1 }} className="mt-6 max-w-[38ch] text-[var(--color-muted)]">
                Your concierge knows the shelf, asks a question or two and fills the cart while you watch.
              </p>

              {/* A glimpse of the concierge at work (illustrative) */}
              <figure data-reveal-child style={{ ["--i" as string]: 2 }} className="mt-14 max-w-[440px] border-t border-[var(--color-ivory)] pt-7">
                <p className="ml-auto max-w-[80%] bg-[var(--color-canvas)] px-5 py-3.5 text-[15px]">
                  Something gentle for six friends on Saturday?
                </p>
                <div className="mt-6 flex gap-4">
                  <NoraAvatar size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="display text-[21px] leading-[1.35]">
                      Live rosin gummies are easy to pace. Start with one piece, then wait two hours.
                    </p>
                    <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-[var(--color-hairline)] pt-4">
                      <div>
                        <p className="text-[14px]">Pink Lemonade Live Rosin Gummies</p>
                        <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">Copperstate · 100 mg pack</p>
                      </div>
                      <div className="flex items-baseline gap-2.5">
                        <span className="tnum text-[12px] text-[var(--color-muted)] line-through">{money(30)}</span>
                        <span className="num text-[16px]">{money(27)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <figcaption className="sr-only">An example exchange with Nora, the concierge</figcaption>
              </figure>
            </div>

            <ol className="lg:col-span-6 lg:col-start-7 lg:pt-4">
              {STEPS.map(({ title, body }, i) => (
                <li
                  key={title}
                  data-reveal-child
                  style={{ ["--i" as string]: i + 1 }}
                  className="grid grid-cols-[56px_1fr] gap-x-6 border-t border-[var(--color-hairline-strong)] py-10 last:border-b sm:grid-cols-[80px_1fr]"
                >
                  <span className="display text-[22px] text-[var(--color-muted)]" aria-hidden>{ROMAN[i]}</span>
                  <div>
                    <h3 className="display text-[28px] leading-[1.12] sm:text-[34px]">{title}</h3>
                    <p className="mt-3 max-w-[44ch] text-[var(--color-muted)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Member benefits */}
        <section aria-labelledby="benefits" className="bg-[var(--color-canvas)]">
          <div data-reveal className="container-club grid gap-16 py-28 sm:py-40 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="benefits" data-reveal-child className="display text-[40px] sm:text-[56px]">
                What membership includes
              </h2>
              <div data-reveal-child style={{ ["--i" as string]: 1 }} className="mt-12 max-w-[380px] border-t border-[var(--color-ivory)] pt-6">
                <p className="text-[13px] text-[var(--color-muted)]">LA Baker Limited Harvest · 3.5 g</p>
                <dl className="mt-5 space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <dt className="text-[14px] text-[var(--color-muted)]">Retail</dt>
                    <dd className="tnum text-[14px] text-[var(--color-muted)] line-through">{money(38)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-[14px] text-[var(--color-muted)]">Member</dt>
                    <dd className="display text-[34px] leading-none">{money(34.2)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-[var(--color-hairline)] pt-3.5">
                    <dt className="text-[14px] text-[var(--color-muted)]">Delivery</dt>
                    <dd className="text-[14px]">Free</dd>
                  </div>
                </dl>
                <p className="mt-5 text-[12px] text-[var(--color-faint)]">Example pricing from the demo catalog.</p>
              </div>
            </div>
            <ul className="grid gap-x-14 gap-y-14 sm:grid-cols-2 lg:col-span-6 lg:col-start-7 lg:pt-4">
              {BENEFITS.map((b, i) => (
                <li key={b.title} data-reveal-child style={{ ["--i" as string]: i + 1 }} className="border-t border-[var(--color-hairline-strong)] pt-6">
                  <h3 className="display text-[26px] leading-[1.15]">{b.title}</h3>
                  <p className="mt-3 max-w-[34ch] text-[14px] text-[var(--color-muted)]">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Interlude: the film shows through again */}
        <section aria-label="Interlude" className="relative grid min-h-[88svh] place-items-center overflow-hidden text-[#FAF9F6]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgb(17_17_17/0.42)_0%,rgb(17_17_17/0.12)_70%,rgb(17_17_17/0)_100%)]" aria-hidden />
          <div data-reveal className="container-club relative text-center">
            <p data-reveal-child className="display mx-auto max-w-[17ch] text-[44px] leading-[1.06] sm:text-[76px] lg:text-[96px]">
              Ask the way you&rsquo;d ask a friend who knows.
            </p>
            <p data-reveal-child style={{ ["--i" as string]: 1 }} className="mx-auto mt-8 max-w-[44ch] text-[16px] text-[#FAF9F6]/80">
              No menu to decode. Nora explains it plainly, then fills the cart.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" aria-labelledby="plans-title" className="bg-[var(--color-canvas)]">
          <div data-reveal className="container-club py-28 sm:py-40">
            <div className="mx-auto max-w-[600px] text-center">
              <h2 id="plans-title" data-reveal-child className="display text-[40px] sm:text-[56px]">
                Membership
              </h2>
              <p data-reveal-child style={{ ["--i" as string]: 1 }} className="mt-6 text-[var(--color-muted)]">
                One fee, member pricing on everything, free delivery. Shop first and join at checkout.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-[1040px] md:grid-cols-2">
              {[
                { ...PLANS[0], primary: false },
                { ...PLANS[1], primary: true },
              ].map((plan, i) => (
                <article
                  key={plan.name}
                  data-reveal-child
                  style={{ ["--i" as string]: i + 2 }}
                  className={`flex flex-col border p-9 sm:p-12 ${
                    plan.primary
                      ? "border-[var(--color-ivory)] bg-[var(--color-cream)] max-md:-mt-px md:-ml-px"
                      : "border-[var(--color-hairline-strong)]"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="display text-[32px]">{plan.name}</h3>
                  </div>
                  <p className="mt-8 flex items-baseline gap-3">
                    <span className="display text-[56px] leading-none">${plan.perMonth % 1 ? plan.perMonth.toFixed(2) : plan.perMonth}</span>
                    <span className="text-[14px] text-[var(--color-muted)]">per month</span>
                  </p>
                  <p className="mt-2 text-[13px] text-[var(--color-muted)]">{plan.billed}</p>
                  <ul className="mt-9 space-y-3.5 border-t border-[var(--color-hairline)] pt-7 text-[14px]">
                    {BENEFITS.map((b) => (
                      <li key={b.title} className="flex gap-4">
                        <span className="mt-[0.7em] h-px w-3 shrink-0 bg-[var(--color-ivory)]" aria-hidden />
                        {b.title}
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop" className={`btn btn-lg mt-12 ${plan.primary ? "btn-primary" : "btn-outline"}`}>
                    Start shopping
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-8 text-center text-[12px] text-[var(--color-faint)]">Demo pricing. Fees are set by the Club before launch.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
