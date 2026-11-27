// "Call a representative": Twilio rings the representative's phone, plays one line and hangs up.
// No conversation is connected. Credentials stay on the server (TWILIO_* in .env.local).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOLDOWN_MS = 30_000;
let lastCall = 0;

// What the call says: a 2-second pause, then one line, nothing else (same as agent/rep_call.py).
// Trial Twilio accounts refuse inline TwiML, so the call fetches it from Twilio's echo twimlet.
// REP_CALL_LINE changes the line; REP_CALL_TWIML_URL (e.g. a TwiML Bin) replaces it entirely.
const LINE = process.env.REP_CALL_LINE || "This is a demo recording. In a real scenario, you would be talking to a representative.";
const TWIML = `<Response><Pause length="2"/><Say voice="Polly.Joanna">${LINE}</Say></Response>`;
const TWIML_URL = process.env.REP_CALL_TWIML_URL || `https://twimlets.com/echo?${new URLSearchParams({ Twiml: TWIML })}`;

export async function POST() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.REP_CALL_TO;
  if (!sid || !token || !from || !to) {
    return Response.json({ ok: false, message: "Calling isn't set up yet." }, { status: 503 });
  }
  if (Date.now() - lastCall < COOLDOWN_MS) {
    return Response.json({ ok: true, message: "A representative is already being called." });
  }
  // claim the slot before Twilio answers (about 2s), so a second tap meanwhile can't ring twice
  lastCall = Date.now();
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Url: TWIML_URL }),
    });
    if (!r.ok) {
      const detail = (await r.json().catch(() => ({}))) as { message?: string };
      console.error("Twilio call failed", r.status, detail.message);
      lastCall = 0;
      return Response.json({ ok: false, message: "The call couldn't be placed. Try again shortly." }, { status: 502 });
    }
    return Response.json({ ok: true, message: "A representative is being called." });
  } catch {
    lastCall = 0;
    return Response.json({ ok: false, message: "The call couldn't be placed. Try again shortly." }, { status: 502 });
  }
}
