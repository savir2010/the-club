import type { Metadata } from "next";
import { Tracking } from "./Tracking";

export const metadata: Metadata = { title: "Order tracking · The Club" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tip?: string; window?: string; to?: string }>;
}) {
  const { id } = await params;
  const { tip, window: slot, to } = await searchParams;
  const n = Number(tip);
  return <Tracking id={id} initialTip={Number.isFinite(n) && n >= 0 && tip ? n : undefined} slot={slot?.slice(0, 40)} to={to?.slice(0, 20)} />;
}
