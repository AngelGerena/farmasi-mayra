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

## Environment variables (Netlify, scope Functions, production)
- `OWNER_PIN` Mayra's leads page PIN
- `SESSION_SECRET` signs her login
- `TEAM_CODE` starting code her team uses for the Team Hub (not case sensitive); she can change it in her panel

Never deploy this with drag-and-drop: the functions would not deploy.
