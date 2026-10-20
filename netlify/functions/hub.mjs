// POST /api/hub {code} -> {hub}. Team members open Mayra's Team Hub with the shared team code.
// TEAM_CODE is a Netlify environment variable (scope: Functions), separate from Mayra's own OWNER_PIN.
// Ten wrong tries from one connection locks it for 15 minutes.
import { getStore } from '@netlify/blobs'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { json } from '../../lib/auth.mjs'
import hub from '../../lib/hub-content.mjs'

const MAX_TRIES = 10
const LOCK_MS = 15 * 60 * 1000

function norm(v) { return String(v || '').trim().toLowerCase().slice(0, 64) }
function digest(v) { return createHmac('sha256', 'team-code').update(v).digest() }

export default async (req, context) => {
  const real = norm(Netlify.env.get('TEAM_CODE'))
  if (!real) return json({ error: 'not_configured' }, 503)
  let body = {}
  try { body = await req.json() } catch {}
  const code = norm(body.code)

  const store = getStore({ name: 'equipo', consistency: 'strong' })
  const who = 'hub-attempts/' + String(context.ip || 'unknown').replace(/[^\w.:-]/g, '_')
  const rec = (await store.get(who, { type: 'json' })) || { n: 0, until: 0 }
  if (rec.until > Date.now()) {
    return json({ error: 'locked', minutes: Math.ceil((rec.until - Date.now()) / 60000) }, 429)
  }

  if (!code || !timingSafeEqual(digest(code), digest(real))) {
    rec.n += 1
    if (rec.n >= MAX_TRIES) { rec.n = 0; rec.until = Date.now() + LOCK_MS }
    await store.setJSON(who, rec)
    return rec.until > Date.now() ? json({ error: 'locked', minutes: 15 }, 429) : json({ error: 'wrong_code' }, 401)
  }

  await store.delete(who)
  return json({ hub })
}

export const config = { path: '/api/hub', method: 'POST' }
