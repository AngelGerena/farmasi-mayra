# Mayra Soto Burgos · Farmasi

Mayra's digital card, her two quizzes, and her private team page. Hosted on Netlify; every push to `main` deploys.

| Path | What it is |
|---|---|
| `/` | Her vCard |
| `/boss/` | Beauty Boss quiz (team recruiting) |
| `/glow/` | Find Your Glow quiz (product picks) |
| `/equipo/` | Mayra's leads, share kit and scripts. Protected by her PIN |

Quiz links take `?src=` (flyer, tent, bag, status, msg, group, person) so each lead shows where it came from.

## How leads flow
1. A visitor finishes a quiz and leaves her name and WhatsApp number. The quiz posts it to the Netlify form `quiz-leads`.
2. Netlify emails the notification and runs `netlify/functions/quiz-intake.mjs`, which saves the lead (Netlify Blobs, store `equipo`).
3. Mayra opens `/equipo/`, enters her PIN, and sees the lead with the next WhatsApp message ready to send.

## Settings in Netlify (Project configuration > Environment variables, scope: Functions)
- `OWNER_PIN`: Mayra's PIN (6+ digits). Changing it signs her out everywhere.
- `SESSION_SECRET`: long random string used to sign sessions.

Both must have a value in the **production** context. Netlify reads them at deploy time, so after adding or changing one, redeploy (Deploys > Trigger deploy). If the PIN page says it is not activated, one of the two is missing.

## Mayra's hidden button
Open the card once on her phone with `?equipo=abrir`. On that phone only, holding her name shows a "Mis leads" button for 10 seconds.
