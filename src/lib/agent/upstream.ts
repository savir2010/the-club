// Server-only: how the shop's API routes reach Nora's agent (agent/main.py).
// Locally it's http://127.0.0.1:8100. When hosted, NORA_AGENT_URL points at the agent's address and
// NORA_AGENT_SECRET (the same value on both sides) proves the request came from this shop.
export const AGENT_URL = (process.env.NORA_AGENT_URL ?? "http://127.0.0.1:8100").replace(/\/+$/, "");

export function agentFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const secret = process.env.NORA_AGENT_SECRET;
  if (secret) headers.set("x-nora-secret", secret);
  return fetch(`${AGENT_URL}${path}`, { ...init, headers });
}
