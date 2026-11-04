# Mayra Soto Burgos · Farmasi director card

Live: https://mayra.okunami.pro (Netlify project `farmasi-mayra`, deploys from `main`).

## Pages
- `/` card: Shop, Why My Team, Book a Call, Next Event, Team Hub, Team Spotlight
- `/mi-equipo/` her story, what she gives her team, first 30 days
- `/llamada/` book a 15-minute call (name, WhatsApp, interest, best time)
- `/evento/` next event with RSVP and Add to Calendar
- `/hub/` Team Hub for her team, opened with the shared team code
- `/equipo/` her private leads page (PIN)

## Look
"Coral Studio" (Mayra's pick from okunami.pro/disenos/mayra): her cutout with the chair over a Farmasi-coral block, candy-gloss buttons, full-screen QR.

## Where content lives
Mayra edits it herself: hold her name on the card (or open /equipo), enter her PIN, tab **Tarjeta**.
- Saved in Netlify Blobs (store `equipo`) through `/api/content`; every save keeps the previous version for "Volver a la versión anterior".
- Starting content before her first save: `lib/default-public.mjs` (event, story, promises, plan, spotlight) and `lib/default-hub.mjs` (Team Hub). `site/data/content.json` is only a fallback if the API is down.
- Team code: set in her panel; falls back to the `TEAM_CODE` env var.
- Follow-up messages, share messages: `site/equipo/index.html`

Call requests and RSVPs post to the Netlify form `quiz-leads`; `netlify/functions/quiz-intake.mjs` turns each into a lead.

## Lola (chat assistant)
- Floating "Pregúntale a Lola" button on the card. Answers Farmasi product and price questions (live from the store copy), events, and joining Mayra's team; saves interested people as leads (source "Lola (chat)") in Mi Panel.
- Code: `site/js/lola.js` (chat), `netlify/functions/lola.mjs` (/api/lola), `lib/lola.mjs` (rules, facts, tools).
- Guardrails: no income or earnings claims, no sign-up prices or commission percentages, no health or cure claims, products and prices only from the store search.
- Hidden until `ANTHROPIC_API_KEY` is set. Billed to whichever Anthropic account owns the key: set a monthly spend limit there too.
- Limits: 40 replies per visitor per day, 30 messages per chat, `LOLA_DAILY_CAP` replies per day for the whole card (default 400).

## Environment variables (Netlify, scope Functions, production)
- `ANTHROPIC_API_KEY` turns Lola on (optional: `LOLA_MODEL`, default claude-haiku-5-5; `LOLA_DAILY_CAP`, default 400)
- `OWNER_PIN` Mayra's leads page PIN
- `SESSION_SECRET` signs her login
- `TEAM_CODE` starting code her team uses for the Team Hub (not case sensitive); she can change it in her panel

Never deploy this with drag-and-drop: the functions would not deploy.
