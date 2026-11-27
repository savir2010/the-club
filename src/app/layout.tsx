import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AgeGate } from "@/components/AgeGate";
import { NavProgress } from "@/components/NavProgress";
import { SessionProvider } from "@/lib/session";
import { ShopProvider } from "@/components/shop/ShopState";
import { CartDrawer } from "@/components/shop/CartDrawer";
import "./globals.css";

// Self-hosted variable fonts (Google Fonts, OFL) so they never depend on a network fetch.
const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin.woff2", style: "normal", weight: "300 700" },
    { path: "../fonts/cormorant-garamond-italic-latin.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});
const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Club · Members-only cannabis concierge",
  description: "Tell us what you want. We bring it to your door. Members only. Demo.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        <SessionProvider>
          <ShopProvider>
            {children}
            <CartDrawer />
          </ShopProvider>
        </SessionProvider>
        <AgeGate />
      </body>
    </html>
  );
}
