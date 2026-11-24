import type { Metadata } from "next";
import { TripReport } from "./TripReport";

export const metadata: Metadata = { title: "Delivery trip report · The Club" };

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripReport id={id.slice(0, 16)} />;
}
