// Texting Nora: register the member's mobile (from the join flow), read whether texting is live,
// and have Nora text this week's picks (weekly).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { agentFetch } from "@/lib/agent/upstream";

const json = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export async function GET(_req: Request, { params }: { params: Promise<{ action: string }> }) {
  if ((await params).action !== "info") return Response.json({ message: "Unknown action." }, { status: 404 });
  try {
    const r = await agentFetch(`/sms/info`, { cache: "no-store" });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ texting: false, nora_number: "" }, { headers: json });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const action = (await params).action;
  if (action !== "register" && action !== "weekly") return Response.json({ message: "Unknown action." }, { status: 404 });
  try {
    const r = await agentFetch(`/sms/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: action === "register" ? await req.text() : "{}" });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ message: "The concierge service isn't running." }, { status: 502 });
  }
}
