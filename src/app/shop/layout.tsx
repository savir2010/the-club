import type { ReactNode } from "react";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { NoraChat } from "@/components/shop/NoraChat";
import { IMessageDemo } from "@/components/shop/IMessageDemo";
import { SiteFooter } from "@/components/SiteChrome";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <ShopHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
      <NoraChat />
      <IMessageDemo />
    </>
  );
}
