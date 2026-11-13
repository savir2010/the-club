import type { Metadata } from "next";
import { SignIn } from "./SignIn";

export const metadata: Metadata = { title: "Sign in · The Club" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // only same-site paths
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/shop";
  return <SignIn next={safe} />;
}
