// The member's shared cart lives on the agent, so a text to Nora shows up here in real time.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { agentFetch } from "@/lib/agent/upstream";


/** The address people reach the site at (e.g. the demo tunnel), so links Nora texts open on a phone. */
function origin(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto.split(",")[0]}://${host.split(",")[0]}` : "";
}

const json = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const since = new URL(req.url).searchParams.get("since") ?? "0";
  try {
    const r = await agentFetch(`/cart?since=${encodeURIComponent(since)}`, { headers: { "x-club-origin": origin(req) }, cache: "no-store" });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ message: "The concierge service isn't running." }, { status: 502 });
  }
}

export async function PUT(req: Request) {
  try {
    const r = await agentFetch(`/cart`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: await req.text() });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ message: "The concierge service isn't running." }, { status: 502 });
  }
}
