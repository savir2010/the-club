// Texting Nora: register the member's mobile (from the join flow), read whether texting is live,
// have Nora text this week's picks (weekly), and receive texts sent to her Twilio number (twilio).
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

function origin(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto.split(",")[0]}://${host.split(",")[0]}` : "";
}

/** Twilio's webhook for texts to Nora's Twilio number. The agent checks Twilio's signature. */
async function twilio(req: Request) {
  try {
    const r = await agentFetch(`/sms/twilio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-twilio-signature": req.headers.get("x-twilio-signature") ?? "",
        "x-club-origin": origin(req),
      },
      body: await req.text(),
    });
    return new Response(r.body, { status: r.status, headers: { "Content-Type": r.headers.get("Content-Type") ?? "text/xml" } });
  } catch {
    return new Response("<Response></Response>", { status: 502, headers: { "Content-Type": "text/xml" } });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const action = (await params).action;
  if (action === "twilio") return twilio(req);
  if (action !== "register" && action !== "weekly") return Response.json({ message: "Unknown action." }, { status: 404 });
  try {
    const r = await agentFetch(`/sms/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: action === "register" ? await req.text() : "{}" });
    return new Response(r.body, { status: r.status, headers: json });
  } catch {
    return Response.json({ message: "The concierge service isn't running." }, { status: 502 });
  }
}
