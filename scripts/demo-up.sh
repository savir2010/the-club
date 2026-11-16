#!/usr/bin/env bash
# One command for demo day, on the Mac that plays Nora:
#   npm run demo
# Builds the shop, opens a public https address for it (works on any wifi, and phones can open
# the links Nora texts), then starts the shop and Nora (web chat, voice and texting).
# Ctrl-C stops everything.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3100
LOG=.demo-logs
mkdir -p "$LOG"
pids=()
cleanup() { echo; echo "Stopping..."; for p in "${pids[@]:-}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM

# free the ports from an earlier run
lsof -ti:$PORT,8100 | xargs kill 2>/dev/null || true

echo "1/4  Building the shop (about a minute)..."
npx next build > "$LOG/build.log" 2>&1 || { echo "Build failed. See $LOG/build.log"; exit 1; }

echo "2/4  Opening a public address..."
URL=""
if command -v cloudflared >/dev/null; then
  cloudflared tunnel --no-autoupdate --url "http://localhost:$PORT" > "$LOG/tunnel.log" 2>&1 &
  pids+=($!)
  for _ in $(seq 1 40); do
    URL=$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG/tunnel.log" | head -1 || true)
    [ -n "$URL" ] && break; sleep 0.5
  done
elif command -v ngrok >/dev/null; then
  ngrok http $PORT --log=stdout > "$LOG/tunnel.log" 2>&1 &
  pids+=($!)
  for _ in $(seq 1 40); do
    URL=$(curl -s localhost:4040/api/tunnels 2>/dev/null | grep -Eo 'https://[^"]+' | head -1 || true)
    [ -n "$URL" ] && break; sleep 0.5
  done
fi
if [ -z "$URL" ]; then
  echo "     No public address (install one with: brew install cloudflared)."
  echo "     Continuing on this network only; links in texts won't open on phones."
fi

echo "3/4  Starting Nora..."
( cd agent && NORA_SMS_BRIDGE=1 NORA_PUBLIC_URL="$URL" .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8100 ) > "$LOG/agent.log" 2>&1 &
pids+=($!)

echo "4/4  Starting the shop..."
npx next start -p $PORT > "$LOG/shop.log" 2>&1 &
pids+=($!)

for _ in $(seq 1 60); do curl -s -o /dev/null "localhost:$PORT/shop" && curl -s -o /dev/null localhost:8100/health && break; sleep 0.5; done
sleep 1
TEXTING=$(curl -s localhost:8100/sms/status || echo '{}')

echo
echo "  The Club is running."
echo "  ─────────────────────────────────────────────"
[ -n "$URL" ] && echo "  Open on any device:  $URL/shop"
echo "  On this Mac:         http://localhost:$PORT/shop"
if echo "$TEXTING" | grep -q '"active":true'; then
  echo "  Texting Nora:        on (people who join with their mobile can text this Mac)"
else
  echo "  Texting Nora:        OFF. Check $LOG/agent.log (Full Disk Access for this terminal?)"
fi
echo "  Reset between runs:  curl -X POST localhost:8100/sms/reset"
echo "  Logs:                $LOG/"
echo "  Ctrl-C to stop."
echo
wait
