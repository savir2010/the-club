// Proxies one sentence of Nora's reply to the agent's voice endpoint and streams the MP3 back.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Nora's replies and ID reading can take a while

import { agentFetch } from "@/lib/agent/upstream";


// GET (?text=...) so an <audio> element can stream it and start playing on the first bytes.
export async function GET(req: Request) {
  const text = new URL(req.url).searchParams.get("text") ?? "";
  try {
    const upstream = await agentFetch(`/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: req.signal,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ message: "The concierge service isn't running. Start it with npm run agent, or check NORA_AGENT_URL." }, { status: 502 });
  }
}
