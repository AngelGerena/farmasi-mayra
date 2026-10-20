// /api/leads: Mayra's lead list. Every call needs a valid session token from /api/auth.
//   GET            -> {leads}
//   POST {lead}    -> add a lead by hand
//   PATCH {id,...} -> update stage, follow-up step, notes
//   DELETE ?id=    -> remove a lead
import { getStore } from '@netlify/blobs'
import { randomUUID } from 'node:crypto'
import { hasValidToken, json } from '../../lib/auth.mjs'

const EDITABLE = ['name', 'phone', 'quiz', 'result', 'lang', 'source', 'products', 'stage', 'step', 'lastContact', 'notes']

function pick(body) {
  const out = {}
  for (const k of EDITABLE) {
    if (!(k in body)) continue
    const v = body[k]
    if (v === null || typeof v === 'number' || typeof v === 'boolean') out[k] = v
    else out[k] = String(v).slice(0, 4000)
  }
  return out
}

function cleanId(v) {
  return String(v || '').replace(/[^\w-]/g, '').slice(0, 64)
}

export default async (req) => {
  if (!hasValidToken(req)) return json({ error: 'auth' }, 401)
  const store = getStore({ name: 'equipo', consistency: 'strong' })

  if (req.method === 'GET') {
    const { blobs } = await store.list({ prefix: 'lead/' })
    const leads = (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean)
    return json({ leads })
  }

  let body = {}
  try { body = await req.json() } catch {}

  if (req.method === 'POST') {
    const id = randomUUID()
    const lead = { ...pick(body), id, origin: 'manual', created: new Date().toISOString(), stage: 'new', step: 0, lastContact: null }
    await store.setJSON('lead/' + id, lead)
    return json({ lead })
  }

  const id = cleanId(body.id || new URL(req.url).searchParams.get('id'))
  if (!id) return json({ error: 'missing_id' }, 400)
  const current = await store.get('lead/' + id, { type: 'json' })
  if (!current) return json({ error: 'not_found' }, 404)

  if (req.method === 'PATCH') {
    const lead = { ...current, ...pick(body), id }
    await store.setJSON('lead/' + id, lead)
    return json({ lead })
  }
  if (req.method === 'DELETE') {
    await store.delete('lead/' + id)
    return json({ ok: true })
  }
  return json({ error: 'method' }, 405)
}

export const config = { path: '/api/leads', method: ['GET', 'POST', 'PATCH', 'DELETE'] }
