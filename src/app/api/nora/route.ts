// Proxies the chat window to the Python concierge agent (agent/main.py) and streams its events back.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Nora's replies and ID reading can take a while

import { agentFetch } from "@/lib/agent/upstream";


export async function POST(req: Request) {
  let upstream: Response;
  try {
    upstream = await agentFetch(`/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      signal: req.signal,
    });
  } catch {
    return Response.json(
      { message: "The concierge service isn't running. Start it with npm run agent, or check NORA_AGENT_URL." },
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
