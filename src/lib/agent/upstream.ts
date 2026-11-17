// Server-only: how the shop's API routes reach Nora's agent (agent/main.py).
// Locally it's http://127.0.0.1:8100. On Vercel, the "agent" service is internal and vercel.json binds
// its address to NORA_AGENT_URL at runtime. NORA_AGENT_SECRET is optional extra protection for hosts
// where the agent is public (such as Render); if set, use the same value on both sides.
export const AGENT_URL = (process.env.NORA_AGENT_URL ?? "http://127.0.0.1:8100").replace(/\/+$/, "");

export function agentFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const secret = process.env.NORA_AGENT_SECRET;
  if (secret) headers.set("x-nora-secret", secret);
  return fetch(`${AGENT_URL}${path}`, { ...init, headers });
}
