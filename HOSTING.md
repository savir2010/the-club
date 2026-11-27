# Putting The Club online (free)

The shop and Nora (web chat, voice and ID reading) run as **one Vercel project** on the free
Hobby plan. Anyone with the link and password can use it, with this Mac turned off.

**Texting Nora is not part of the hosted version.** iMessage only works from a Mac, so the online
site hides everything to do with texting. For live texting, run the demo from the Mac
([NORA-SMS-SETUP.md](NORA-SMS-SETUP.md)).

## How it's arranged

`vercel.json` defines two services in one project:

| Service | Folder | Reachable from the internet? |
|---|---|---|
| `shop` (Next.js) | the repo root | Yes, every path |
| `agent` (Nora, FastAPI) | `agent/` | No. Only the shop can call it. |

Vercel gives the shop the agent's private address in `NORA_AGENT_URL`, so there's nothing to
copy between services.

## Setup (about 5 minutes)

1. Sign up at [vercel.com](https://vercel.com) **with GitHub** (choose Hobby).
2. **Add New** > **Project** > import `the-club`. Vercel reads `vercel.json`; leave the build
   settings alone.
3. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `ANTHROPIC_KEY` | the Anthropic key |
   | `SITE_PASSWORD` | a password for the demo (the username is `club`) |

   Optional, for **Speak to someone** (the header link, and Nora when someone asks for a person).
   Without these the link says calling isn't set up.

   | Name | Value |
   |---|---|
   | `TWILIO_ACCOUNT_SID` | from the Twilio console |
   | `TWILIO_AUTH_TOKEN` | from the Twilio console |
   | `TWILIO_FROM_NUMBER` | the Twilio number the call comes from |
   | `REP_CALL_TO` | the phone that rings |
   | `REP_CALL_LINE` | optional: what the call says after a 2-second pause |

4. Click **Deploy**. When it finishes, open the address Vercel shows, sign in with `club` and
   your password, and try the chat.

Every push to `main` redeploys automatically.

## Good to know

- **Everyone shares one demo member, Dana.** Carts aren't kept on the server between visits: the
  cart lives in the browser tab.
- **Cost:** free. Vercel's Hobby plan is meant for non-commercial use; if this becomes a paid
  client project, move to Vercel Pro.
- **Without a password:** delete `SITE_PASSWORD` and redeploy. Anyone with the link can then use
  it, and their chats use your Anthropic credit.
- **Alternative host for Nora:** `render.yaml` runs the agent on Render instead. Then set
  `NORA_AGENT_URL` and the same `NORA_AGENT_SECRET` on both sides.
