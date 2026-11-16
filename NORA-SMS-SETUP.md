# Running the demo on the Mac that plays Nora

This one Mac runs everything:
- **the shop**, reachable from any device through a public https address;
- **Nora** (web chat, voice and texting);
- **the shared cart.** When someone texts Nora, the item appears in their website cart within about a second, and the reverse also works.

People **join on the website with their mobile number**. From then on, Nora recognizes texts from that number as their account. There's no separate login. No real order or payment happens.

**What it reads:** only texts from registered numbers (plus any in `NORA_SMS_ALLOW`), only in one-to-one threads, and only texts that arrive after it starts. Nothing else in Messages is read. Everything is kept in memory and cleared when it stops.

## One-time setup (about 15 minutes)

1. **Install the tools.** You need Node 20+, Python 3.11+ and Cloudflare's tunnel:
   ```
   brew install cloudflared
   ```
2. **Get the code:**
   ```
   git clone https://github.com/savir2010/the-club.git
   cd the-club
   npm install
   npm run agent:setup
   ```
3. **Settings.** Create `the-club/.env.local` with:
   ```
   ANTHROPIC_KEY=<the key Savir sends you privately>
   NORA_SMS_NUMBER=+1XXXXXXXXXX     # this Mac's iMessage number, shown to people who join
   ```
   `NORA_SMS_ALLOW=+1…` is optional. Use it for numbers that should reach Nora without joining first, such as Savir's phone for testing.
4. **Mac permissions** (System Settings > Privacy & Security):
   - **Full Disk Access:** turn it on for Terminal, then quit Terminal completely and reopen it.
   - **Automation > Messages:** macOS asks the first time Nora sends a text. Click Allow.
5. **Messages** must be open and signed in to iMessage.

## Demo day
```
caffeinate -dis &
npm run demo
```
It builds the shop, opens a public address, starts everything, and prints:
```
  Open on any device:  https://something.trycloudflare.com/shop
  Texting Nora:        on
```
Open that address on the demo laptop. The address changes every time you run `npm run demo`, so use the new one each time.

**The flow:**
1. Browse and add to the cart.
2. Proceed to checkout and join: ID, the state check, bank, then the plan step.
3. On the plan step, enter **your real mobile number** under "Text Nora anytime".
4. Text this Mac's number from that phone: "add the LA Baker flower".
5. Watch it arrive in the website cart.
6. Text "deliver tonight 8 to 9 at home, place it". The site shows "Order placed" with a tracking link.

**Before the audience arrives:**
- Do one real test text, so the macOS "allow Terminal to control Messages" popup doesn't appear mid-demo.
- Save this Mac's number as **"Nora"** in the demo phone's contacts. iMessage only shows link previews (product photos) automatically for saved contacts.
- Reset with `curl -X POST localhost:8100/sms/reset`. That clears the cart, conversations and registered numbers, and starts the order number again at CL-20512.

**During the demo:**
- Don't type in the thread from this Mac or its paired iPhone.
- Nora takes about 3 to 8 seconds to reply.

| Action | Command |
|---|---|
| Status | `curl localhost:8100/sms/status` |
| **Stop texting immediately** | `curl -X POST localhost:8100/sms/stop` (or Ctrl-C to stop everything) |
| Resume texting | `curl -X POST localhost:8100/sms/start` |
| Reset between rehearsals | `curl -X POST localhost:8100/sms/reset` |

**Caps:** at most 60 replies per run (`NORA_SMS_MAX_REPLIES` changes it). Group chats and unknown numbers are ignored.

## Rehearse without sending real texts
```
NORA_SMS_DRY_RUN=1 npm run demo
```
Pretend to text Nora from a registered number:
```
curl -X POST localhost:8100/sms/inject -H 'Content-Type: application/json' \
  -d '{"handle":"+16025550100","text":"add the LA Baker flower"}'
curl localhost:8100/sms/status     # "outbox" shows what Nora would have texted
```

## If something's wrong
- **"Texting Nora: OFF" / "Can't read …chat.db":** Full Disk Access isn't on for Terminal. Turn it on, quit Terminal fully and reopen it.
- **"No iMessage account is signed in":** Messages > Settings > iMessage, then sign in.
- **Nora doesn't answer a text:** the number must be the one entered when joining. Only the last 10 digits are compared. Check `curl localhost:8100/sms/status`: is it listed under `registered`? What does `error` say?
- **Links show no photo:** save the number as a contact, or tap "Tap to load preview".
- **No public address:** run `brew install cloudflared`. Without it the demo still runs on this Mac, but links in texts won't open on phones.
- **Logs:** `.demo-logs/` (build, tunnel, agent, shop).
