// POST /api/auth {pin} -> {token}. Five wrong tries from one connection locks it for 15 minutes.
import { getStore } from '@netlify/blobs'
import { configured, pinMatches, makeToken, json } from '../../lib/auth.mjs'

const MAX_TRIES = 5
const LOCK_MS = 15 * 60 * 1000

export default async (req, context) => {
  if (!configured()) return json({ error: 'not_configured' }, 503)
  let body = {}
  try { body = await req.json() } catch {}
  const pin = String(body.pin || '').trim().slice(0, 64)

  const store = getStore({ name: 'equipo', consistency: 'strong' })
  const who = 'attempts/' + String(context.ip || 'unknown').replace(/[^\w.:-]/g, '_')
  const rec = (await store.get(who, { type: 'json' })) || { n: 0, until: 0 }
  if (rec.until > Date.now()) {
    return json({ error: 'locked', minutes: Math.ceil((rec.until - Date.now()) / 60000) }, 429)
  }

  if (!pin || !pinMatches(pin)) {
    rec.n += 1
    if (rec.n >= MAX_TRIES) { rec.n = 0; rec.until = Date.now() + LOCK_MS }
    await store.setJSON(who, rec)
    return rec.until > Date.now()
      ? json({ error: 'locked', minutes: 15 }, 429)
      : json({ error: 'wrong_pin', left: MAX_TRIES - rec.n }, 401)
  }

  await store.delete(who)
  return json({ token: makeToken() })
}

export const config = { path: '/api/auth', method: 'POST' }
