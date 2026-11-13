# The Club — demo (visual pass)

Members-only cannabis concierge demo. This pass covers the design and every page in the brief. Nora, the concierge, is a live Claude agent (`claude-sonnet-5-5`, streamed, with tool use) behind `/api/nora`. Put `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`); without a key the chat falls back to a scripted offline demo.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

The age gate shows on first visit. Add `?gate` to any URL to show it again, or `?nogate` to skip it (useful for screen recordings).

## Pages

| Route | What it shows |
|---|---|
| `/` | Age gate, hero, how it works, member benefits, image break, plans |
| `/come-back-later` | Where "No" on the age gate goes |
| `/join` | Five steps: Account, Age and ID, Medical card (upload or telehealth), Bank, Plan, then Nora's welcome |
| `/shop` | Product grid (20 products) with category tabs, search, filters and sort. Cart drawer from the header, "Show phone" simulated text panel, floating "Ask Nora" chat window |
| `/shop/[id]` | Product page: gallery, specs, about this item, buy box (quantity, add to cart, buy now), members also bought, member reviews |
| `/checkout` | One-page checkout: address, delivery window, bank, items, Make this monthly, tip selector, totals |
| `/orders/[id]` | Status steps, mock map with a moving dot, driver card, tip editor |
| `/account` | Profile, past orders, the likes and dislikes Nora reads |
| `/account/subscriptions` | Monthly box with bundle pricing, next delivery, Edit / Skip a month / Pause |

## Where things live

- Design tokens: `src/app/globals.css` (colours, type, radii, motion)
- Demo data (fictional): `src/lib/data.ts`. Field names match the brief's `catalog.json` spec.
- Price display ("member ledger"): `src/components/Ledger.tsx`
- Product placeholder art: `src/components/ProductArt.tsx`
- Photo credits: `public/img/CREDITS.md`

`scripts/shoot.mjs` captures every page at 1440 and 390 px with Playwright, using your installed Chrome.

## The concierge agent (Python)

Nora runs as a separate Python service in `agent/`. The site's `/api/nora` route only proxies to it.

```bash
npm run agent:setup   # once: creates agent/.venv and installs requirements
npm run agent         # starts the agent on http://127.0.0.1:8100 (auto-reloads)
npm run dev -- -p 3100
```

The key is read from the environment (`ANTHROPIC_API_KEY` or `ANTHROPIC_KEY`), loaded from `agent/.env`, `.env.local`, `.env` or the parent folder's `.env`. See `.env.example`.

- `agent/main.py`: FastAPI service. `POST /chat` runs the streaming tool-use loop on `claude-sonnet-5-5` and streams newline-delimited JSON events (`src/lib/agent/events.ts`): text, product cards, cart changes, reply chips, texts to the simulated phone, and checkout. `POST /tts` speaks a sentence (see Voice mode). `GET /health` reports the model and whether a key is set.
- `agent/tools.py`: the brief's tools (`search_catalog`, `get_product`, `add_to_cart`, `remove_from_cart`, `update_quantity`, `view_cart`, `get_member_profile`, `get_bundles`) plus `show_products`, `go_to_checkout`, `send_text` (the simulated phone) and `suggest_replies`. Inputs are validated with pydantic.
- `agent/shop.py`: catalog search (house brands first), cart totals, bundles and purchase limits. The model never does the maths.
- `agent/prompt.py`: persona, selling rules, and health and safety rules.
- `data/*.json`: the catalog, bundles, member, persona, purchase limits and tax rate, shared by the agent and the site.

Nothing Nora says is written into the site: the greeting, every reply and the suggestion chips all come from the agent. The browser keeps the transcript and sends it back unchanged each turn, with the current cart.

## Voice mode

Tap the mic in Nora's chat header. You talk, Nora answers out loud, then listens again.

- **Listening:** the browser's built-in speech recognition. Free, no key. Works in Chrome, Edge and Safari (not Firefox). Chrome sends the audio to Google to transcribe.
- **Speaking:** `POST /tts` on the agent (proxied at `GET /api/nora/tts?text=`) streams a Microsoft neural voice through the `edge-tts` package. Free, no key. The default is `en-IE-EmilyNeural`, an Irish woman. Change it with `NORA_VOICE`, and the speed with `NORA_VOICE_RATE` (default `+4%`).
- Replies are spoken a sentence at a time while Nora is still writing. Tap the mic while she talks to cut her off; tap it while she listens to end voice mode.
- `edge-tts` uses the voice service behind Edge's Read Aloud, not an official API, so it can be slow at times or change without notice. For anything beyond a demo, use Azure Speech, which has the same voice and a free monthly allowance.
- Spoken messages reach the agent prefixed `[spoken]`, so Nora keeps those replies short and easy to listen to.
