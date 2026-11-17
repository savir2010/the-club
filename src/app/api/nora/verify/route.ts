// Sign-up document check: the agent reads the ID or medical card photo and compares it with what
// the member entered. The photo passes through; nothing is stored.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Nora's replies and ID reading can take a while

import { agentFetch } from "@/lib/agent/upstream";

const json = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export async function POST(req: Request) {
  try {
    const r = await agentFetch(`/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: await req.text() });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ message: "The verification service isn't running." }, { status: 502 });
  }
}
