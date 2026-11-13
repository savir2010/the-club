// Proxies the scripted iMessage demo (start, status, stop) to the agent.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_URL = process.env.NORA_AGENT_URL ?? "http://127.0.0.1:8100";
const ACTIONS = new Set(["start", "status", "stop"]);

async function forward(req: Request, action: string) {
  if (!ACTIONS.has(action)) return Response.json({ message: "Unknown action." }, { status: 404 });
  try {
    const upstream = await fetch(`${AGENT_URL}/imessage/${action}`, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method === "POST" ? await req.text() : undefined,
    });
    return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "The concierge service isn't running. Start it with npm run agent." }, { status: 502 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }) {
  return forward(req, (await params).action);
}
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  return forward(req, (await params).action);
}
