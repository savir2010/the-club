import type { ReactNode } from "react";

// Re-mounts on every navigation inside the shop, so each page eases in under the header.
export default function ShopTemplate({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
