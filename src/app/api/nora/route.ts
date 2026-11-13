// Proxies the chat window to the Python concierge agent (agent/main.py) and streams its events back.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_URL = process.env.NORA_AGENT_URL ?? "http://127.0.0.1:8100";

export async function POST(req: Request) {
  let upstream: Response;
  try {
    upstream = await fetch(`${AGENT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      signal: req.signal,
    });
  } catch {
    return Response.json(
      { message: "The concierge service isn't running. Start it with npm run agent." },
      { status: 502 },
    );
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/x-ndjson",
      "Cache-Control": "no-store",
    },
  });
}
