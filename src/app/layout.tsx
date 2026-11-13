import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AgeGate } from "@/components/AgeGate";
import { SessionProvider } from "@/lib/session";
import { ShopProvider } from "@/components/shop/ShopState";
import { CartDrawer } from "@/components/shop/CartDrawer";
import "./globals.css";

// Self-hosted (from @fontsource-variable/manrope) so it never depends on a network fetch.
const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Club · Members-only cannabis concierge",
  description: "Tell us what you want. We bring it to your door. Members only. Demo.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f2ea",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable}`}>
      <body>
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
