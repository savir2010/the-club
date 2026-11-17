# Putting The Club online (free)

This puts the shop and Nora (web chat, voice and ID reading) online, so anyone with the link and
password can try it from any device, with this Mac turned off.

**Texting Nora is not part of the hosted version.** iMessage only works from a Mac, so the online
site hides everything to do with texting. For live texting, run the demo from the Mac
([NORA-SMS-SETUP.md](NORA-SMS-SETUP.md)).

Two free services, about 10 minutes:

| Part | Service | Free plan |
|---|---|---|
| Nora's agent (Python) | [Render](https://render.com) | Free web service |
| The shop (Next.js) | [Vercel](https://vercel.com) | Hobby |

Do Render first: Vercel needs two values from it.

## 1. Nora on Render

1. Sign up at [render.com](https://render.com) **with GitHub**, and allow it to see the `the-club` repo.
2. Click **New** > **Blueprint** and pick `the-club`. Render reads `render.yaml` from the repo.
3. It asks for **ANTHROPIC_KEY**. Paste the Anthropic key, then click **Deploy Blueprint**.
4. Wait for **Live** (a few minutes the first time). Then, on the `nora-agent` service, copy:
   - **the address** at the top, like `https://nora-agent-xxxx.onrender.com`
   - **NORA_AGENT_SECRET** from the **Environment** tab (Render made it up; click the eye to reveal it)

Check it: open `https://nora-agent-xxxx.onrender.com/health`. It should say `"connected": true`.

<details><summary>If Render won't let you use a Blueprint</summary>

Click **New** > **Web Service**, pick `the-club`, and fill in:
- Language: **Python 3** · Instance type: **Free**
- Build command: `pip install -r agent/requirements.txt`
- Start command: `cd agent && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `ANTHROPIC_KEY` (the key), `NORA_AGENT_SECRET` (any long random
  text; make one with `openssl rand -hex 24`), `PYTHON_VERSION` = `3.12.7`
</details>

## 2. The shop on Vercel

1. Sign up at [vercel.com](https://vercel.com) **with GitHub** (choose Hobby).
2. **Add New** > **Project** > import `the-club`. Vercel recognizes Next.js; leave the build settings alone.
3. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NORA_AGENT_URL` | the Render address from step 1, with no slash at the end |
   | `NORA_AGENT_SECRET` | the same secret as on Render |
   | `SITE_PASSWORD` | a password for the demo (the username is `club`) |

4. Click **Deploy**. When it finishes, Vercel shows the address, like `https://the-club-xxxx.vercel.app`.

Open it, sign in with `club` and your password, and try the chat.

## Good to know

- **Nora sleeps when nobody uses her.** On Render's free plan the agent sleeps after 15 minutes
  without visitors, and waking takes up to a minute. The shop wakes her as soon as it opens, so
  **open the site a minute before you show it**. While she's waking, the chat may say the
  concierge isn't available; wait a moment and try again.
- **Waking up clears the shared cart.** Conversations live in the browser and aren't affected.
- **Everyone shares one demo member, Dana.** Two people trying it at the same time will see the
  same cart.
- **Updates are automatic.** Every push to `main` redeploys both services.
- **Cost:** both plans are free. Vercel's Hobby plan is meant for non-commercial use; if this
  becomes a paid client project, move the shop to Vercel Pro.
- **Without a password:** delete `SITE_PASSWORD` in Vercel and redeploy. Anyone with the link can
  then use it, and their chats use your Anthropic credit.
