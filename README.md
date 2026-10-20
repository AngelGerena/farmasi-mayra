# Mayra Soto Burgos · Farmasi director card

Live: https://farmasi.mayra.finessemedia.pro (Netlify project `farmasi-mayra`, deploys from `main`).

## Pages
- `/` card: Shop, Why My Team, Book a Call, Next Event, Team Hub, Team Spotlight
- `/mi-equipo/` her story, what she gives her team, first 30 days
- `/llamada/` book a 15-minute call (name, WhatsApp, interest, best time)
- `/evento/` next event with RSVP and Add to Calendar
- `/hub/` Team Hub for her team, opened with the shared team code
- `/equipo/` her private leads page (PIN)

## Where to edit
- Event, story, promises, 30-day plan, spotlight: `site/data/content.json`
- Team Hub (checklist, schedule, links, promos, team list): `lib/hub-content.mjs`
- Follow-up messages, share messages: `site/equipo/index.html`

Call requests and RSVPs post to the Netlify form `quiz-leads`; `netlify/functions/quiz-intake.mjs` turns each into a lead.

## Environment variables (Netlify, scope Functions, production)
- `OWNER_PIN` Mayra's leads page PIN
- `SESSION_SECRET` signs her login
- `TEAM_CODE` code her team uses for the Team Hub (not case sensitive)

Never deploy this with drag-and-drop: the functions would not deploy.
