import type { Metadata } from "next";
import { IPhoneThread } from "./IPhoneThread";

export const metadata: Metadata = { title: "Nora by text · The Club demo" };

export default function IMessageDemoPage() {
  return <IPhoneThread />;
}
