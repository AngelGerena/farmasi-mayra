// Mayra's editable content, stored in Netlify Blobs (store "equipo").
//   content/public  -> event, story, promises, 30-day plan, spotlight (anyone can read)
//   content/hub     -> Team Hub (only after the team code)
//   settings/teamcode -> team code she sets in her panel (falls back to the TEAM_CODE env var)
// Every save keeps the previous version under <key>.prev so she can restore it.
import { getStore } from '@netlify/blobs'
import defaultPublic from './default-public.mjs'
import defaultHub from './default-hub.mjs'

export const store = () => getStore({ name: 'equipo', consistency: 'strong' })
const DEFAULTS = { public: defaultPublic, hub: defaultHub }

export async function read(which) {
  const saved = await store().get('content/' + which, { type: 'json' })
  return saved || DEFAULTS[which]
}

export async function save(which, data) {
  const s = store()
  const current = await s.get('content/' + which, { type: 'json' })
  await s.setJSON('content/' + which + '.prev', current || DEFAULTS[which])
  await s.setJSON('content/' + which, data)
}

export async function restore(which) {
  const s = store()
  const prev = await s.get('content/' + which + '.prev', { type: 'json' })
  if (!prev) return null
  const current = await s.get('content/' + which, { type: 'json' })
  await s.setJSON('content/' + which, prev)
  await s.setJSON('content/' + which + '.prev', current || DEFAULTS[which])
  return prev
}

export async function teamCode() {
  const saved = await store().get('settings/teamcode', { type: 'text' })
  return String(saved || Netlify.env.get('TEAM_CODE') || '').trim().toLowerCase()
}

export async function setTeamCode(code) {
  await store().set('settings/teamcode', String(code).trim().toLowerCase())
}
