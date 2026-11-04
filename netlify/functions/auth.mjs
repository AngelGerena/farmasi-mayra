// POST /api/auth {pin} -> {token}. Five tries from one connection, then it locks for 15 minutes.
import { getStore } from '@netlify/blobs'
import { configured, pinMatches, makeToken, json, claimTry } from '../../lib/auth.mjs'

const MAX_TRIES = 5
const LOCK_MS = 15 * 60 * 1000

export default async (req, context) => {
  if (!configured()) return json({ error: 'not_configured' }, 503)
  let body = {}
  try { body = await req.json() } catch {}
  const pin = String(body.pin || '').trim().slice(0, 64)

  const store = getStore({ name: 'equipo', consistency: 'strong' })
  const who = 'attempts/' + String(context.ip || 'unknown').replace(/[^\w.:-]/g, '_')
  const t = await claimTry(store, who, MAX_TRIES, LOCK_MS)
  if (t.locked) return json({ error: 'locked', minutes: t.locked }, 429)
  if (t.busy) return json({ error: 'busy' }, 429)
  if (!pin || !pinMatches(pin)) {
    return t.left > 0 ? json({ error: 'wrong_pin', left: t.left }, 401) : json({ error: 'locked', minutes: 15 }, 429)
  }

  await store.delete(who)
  return json({ token: makeToken() })
}

export const config = { path: '/api/auth', method: 'POST' }
