# Running Nora over iMessage (for the Mac that plays Nora)

You text this Mac's number, and Nora answers from it: she recommends products, fills a cart and places a demo order. No real order or payment happens.

**What it reads:** only texts from the numbers in `NORA_SMS_ALLOW`, only in one-to-one threads, and only texts that arrive after it starts. Nothing else in Messages is read, and conversations are kept in memory only.

## One-time setup (about 10 minutes)

1. **Copy the project** (the `club` folder) to this Mac. Bring the `.env` file containing the API key by AirDrop or USB, not by chat or email, and put it in the folder above `club/`.
2. **Install:** you need Node 20+ and Python 3.11+.
   ```
   cd club
   npm install
   npm run agent:setup
   ```
3. **Allow the sender.** Create `club/.env.local` with:
   ```
   NORA_SMS_ALLOW=+14086892766
   ```
   For more than one sender, separate numbers with commas. Apple ID emails work too.
4. **Permissions** (System Settings > Privacy & Security):
   - **Full Disk Access:** turn it on for the terminal app you'll use (Terminal, iTerm or Ghostty), then quit and reopen the terminal. This is how the bridge sees incoming texts.
   - **Automation > Messages:** macOS asks the first time Nora sends a text. Click Allow.
5. **Messages** must be open and signed in to iMessage on this Mac.

## Rehearse without sending anything
```
npm run nora-sms:dry
```
This prints Nora's replies in the terminal instead of texting. In a second terminal, pretend to text:
```
curl -X POST localhost:8100/sms/inject -H 'Content-Type: application/json' \
  -d '{"handle":"+14086892766","text":"something chill for tonight?"}'
curl localhost:8100/sms/status
```

## Demo day
```
caffeinate -dis &           # keep the Mac awake
npm run nora-sms
```
Wait for **"Nora is listening for texts from +14086892766 [live]"**, then text this Mac's number from the allowed phone.

- **Don't type in the thread** from this Mac or your iPhone during the demo. Your texts would mix with Nora's.
- Each reply takes about 3 to 8 seconds while Nora looks through the shelf.
- Tip: on the texting phone, rename this contact to "Nora" for the demo.

| Action | Command |
|---|---|
| Check status | `curl localhost:8100/sms/status` |
| **Stop immediately** | `curl -X POST localhost:8100/sms/stop` (or Ctrl-C) |
| Start listening again | `curl -X POST localhost:8100/sms/start` |
| Start a fresh conversation | `curl -X POST localhost:8100/sms/reset` |

**Caps:** at most 40 replies per run (`NORA_SMS_MAX_REPLIES` changes it). Group chats and unknown numbers are ignored.

**Optional tracking link:** run the shop too (`npx next dev -p 3100`) and set `NORA_PUBLIC_URL=http://<this-mac>.local:3100` in `.env.local`. Order confirmations will then include a tracking link, which opens on phones on the same wifi.

## If something's wrong
- **"Can't read …chat.db":** Full Disk Access isn't on for this terminal. Turn it on, then fully quit and reopen the terminal.
- **"No iMessage account is signed in":** open Messages > Settings > iMessage and sign in.
- **Nora doesn't answer:** make sure the sender's number is in `NORA_SMS_ALLOW` exactly. Only the last 10 digits are compared. Then run `curl localhost:8100/sms/status` and read the `error` field.
