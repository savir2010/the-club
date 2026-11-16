// Texting Nora: register the member's mobile (from the join flow) and read whether texting is live.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_URL = process.env.NORA_AGENT_URL ?? "http://127.0.0.1:8100";
const json = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export async function GET(_req: Request, { params }: { params: Promise<{ action: string }> }) {
  if ((await params).action !== "info") return Response.json({ message: "Unknown action." }, { status: 404 });
  try {
    const r = await fetch(`${AGENT_URL}/sms/info`, { cache: "no-store" });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ texting: false, nora_number: "" }, { headers: json });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  if ((await params).action !== "register") return Response.json({ message: "Unknown action." }, { status: 404 });
  try {
    const r = await fetch(`${AGENT_URL}/sms/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: await req.text() });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ message: "The concierge service isn't running." }, { status: 502 });
  }
}
