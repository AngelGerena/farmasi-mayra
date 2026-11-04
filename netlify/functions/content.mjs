// /api/content
//   GET                    -> public card content (event, story, spotlight). Anyone.
//   GET ?scope=owner       -> public + hub + team code, for Mayra's editor. Needs her PIN session.
//   PUT {which, data}      -> save "public" or "hub" (previous version kept). Needs her PIN session.
//   PUT {teamCode}         -> change the code her team uses for the Team Hub. Needs her PIN session.
//   POST {restore: which}  -> bring back the previous version of "public" or "hub". Needs her PIN session.
import { hasValidToken, json } from '../../lib/auth.mjs'
import { read, save, restore, teamCode, setTeamCode } from '../../lib/content.mjs'

const MAX_BYTES = 200000
const WHICH = ['public', 'hub']

export default async (req) => {
  const url = new URL(req.url)
  if (req.method === 'GET' && url.searchParams.get('scope') !== 'owner') {
    const res = json(await read('public'))
    res.headers.set('cache-control', 'no-cache')
    return res
  }
  if (!hasValidToken(req)) return json({ error: 'auth' }, 401)

  if (req.method === 'GET') {
    return json({ public: await read('public'), hub: await read('hub'), teamCode: await teamCode() })
  }

  const raw = await req.text()
  if (raw.length > MAX_BYTES) return json({ error: 'too_big' }, 413)
  let body = {}
  try { body = JSON.parse(raw) } catch { return json({ error: 'bad_json' }, 400) }

  if (req.method === 'POST' && WHICH.includes(body.restore)) {
    const data = await restore(body.restore)
    return data ? json({ data }) : json({ error: 'nothing_to_restore' }, 404)
  }
  if (req.method === 'PUT' && typeof body.teamCode === 'string') {
    const code = body.teamCode.trim()
    if (code.length < 4 || code.length > 40) return json({ error: 'code_length' }, 400)
    await setTeamCode(code)
    return json({ ok: true })
  }
  if (req.method === 'PUT' && WHICH.includes(body.which) && body.data && typeof body.data === 'object') {
    await save(body.which, body.data)
    return json({ ok: true })
  }
  return json({ error: 'bad_request' }, 400)
}

export const config = { path: '/api/content', method: ['GET', 'PUT', 'POST'] }
