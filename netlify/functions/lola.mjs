// /api/lola: Lola, the chat assistant on Mayra's card.
//   GET                                   -> {on}   (is Lola switched on: the API key is set)
//   POST {messages:[{role,content}], lang, lead_id?}
//        -> {reply, lead_id, products:[{name, price, promo, img, url}]}  or {offline:true} / {error}
//
// Billing: Mayra's own Anthropic account. Netlify environment variables (scope Functions, production):
//   ANTHROPIC_API_KEY   her key (Lola stays off until it is set)
//   LOLA_MODEL          optional, default claude-haiku-5-5
//   LOLA_DAILY_CAP      optional, replies per day for the whole card, default 400 (a runaway bill guard)
// Also set a monthly spend limit in her Anthropic console.
import { getStore } from '@netlify/blobs'
import { randomUUID, createHash } from 'node:crypto'
import { search } from '../../lib/catalog.mjs'
import { readIndex } from '../../lib/catalog-index.mjs'
import { store as catalogStore } from '../../lib/catalog.mjs'
import { read as readContent } from '../../lib/content.mjs'
import { SYSTEM_RULES, TOOLS, liveFacts } from '../../lib/lola.mjs'

const env = (k) => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || ''
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, n)
const PER_VISITOR_DAY = 40          // replies one visitor can get in a day
const MAX_TURNS = 30                // messages in one conversation

const day = () => new Date().toISOString().slice(0, 10)
async function overLimit(req) {
  const s = getStore({ name: 'lola', consistency: 'strong' })
  const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim()
  const who = createHash('sha256').update(ip + '|' + day()).digest('hex').slice(0, 24)
  const [all, mine] = await Promise.all([s.get('day/' + day(), { type: 'text' }), s.get('ip/' + day() + '/' + who, { type: 'text' })])
  const cap = Number(env('LOLA_DAILY_CAP')) || 400
  if ((Number(all) || 0) >= cap) return 'busy'
  if ((Number(mine) || 0) >= PER_VISITOR_DAY) return 'limit'
  await Promise.all([s.set('day/' + day(), String((Number(all) || 0) + 1)), s.set('ip/' + day() + '/' + who, String((Number(mine) || 0) + 1))])
  return ''
}

async function findProducts(query) {
  const sections = await readIndex(catalogStore())
  return search(clip(query, 60), sections, 6).map((p) => ({ name: p.name, price: p.price, promo: p.promo || 0, img: p.img, url: p.url }))
}

/** Save or update the visitor as a lead on Mayra's panel (same shape as the call form's leads). */
async function saveLead(input, leadId, lang) {
  const s = getStore({ name: 'equipo', consistency: 'strong' })
  let digits = clip(input.phone, 30).replace(/\D/g, '')
  if (digits.length === 10) digits = '1' + digits
  const name = clip(input.name, 80)
  if (!name || digits.length < 11 || digits.length > 15) return { ok: false, note: 'Need a first name and a full phone number with area code.' }
  const interest = ['join', 'info', 'shop', 'event'].includes(input.interest) ? input.interest : 'info'
  const id = leadId && /^[\w-]{8,64}$/.test(leadId) ? leadId : ''
  const old = id ? await s.get('lead/' + id, { type: 'json' }) : null
  const lead = old || { id: randomUUID(), origin: 'lola', stage: 'new', step: 0, created: new Date().toISOString(), lastContact: null, products: '' }
  Object.assign(lead, {
    name, phone: digits, quiz: interest === 'event' ? 'event' : 'call', result: interest, lang: lang === 'en' ? 'en' : 'es', source: 'lola',
    answers: clip(input.best_time, 120) || lead.answers || '',
    notes: ('Lola: ' + (clip(input.summary, 600) || (old && old.notes ? old.notes.replace(/^Lola: /, '') : ''))).trim()
  })
  await s.setJSON('lead/' + lead.id, lead)
  return { ok: true, id: lead.id }
}

export default async (req) => {
  const key = env('ANTHROPIC_API_KEY')
  if (req.method === 'GET') return json({ on: !!key })
  if (req.method !== 'POST') return json({ error: 'bad_request' }, 405)
  if (!key) return json({ offline: true })
  let b = {}
  try { b = await req.json() } catch { return json({ error: 'bad_request' }, 400) }
  const lang = b.lang === 'en' ? 'en' : 'es'
  const history = (Array.isArray(b.messages) ? b.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: clip(m.content, m.role === 'user' ? 600 : 1500) }))
  if (!history.length || history[history.length - 1].role !== 'user') return json({ error: 'bad_request' }, 400)
  if (history.filter((m) => m.role === 'user').length > MAX_TURNS) return json({ error: 'long' })
  const limited = await overLimit(req)
  if (limited) return json({ error: limited })

  const messages = history.slice(-20)
  while (messages.length && messages[0].role !== 'user') messages.shift()
  let leadId = clip(b.lead_id, 64), products = []
  const content = await readContent('public').catch(() => null)
  const system = [
    { type: 'text', text: SYSTEM_RULES, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: liveFacts(content) + `\nThe visitor's card is set to ${lang === 'en' ? 'English' : 'Spanish'}.` + (leadId ? '\nThis visitor is already saved for Mayra; update them with save_lead if you learn more.' : '') }
  ]
  const texts = []
  try {
    for (let turn = 0; turn < 4; turn++) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: env('LOLA_MODEL') || 'claude-haiku-5-5', max_tokens: 700, system, tools: TOOLS, messages })
      })
      if (!res.ok) { console.log('lola anthropic', res.status, (await res.text()).slice(0, 300)); break }
      const out = await res.json()
      const text = (out.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim()
      if (text) texts.push(text)
      const uses = (out.content || []).filter((c) => c.type === 'tool_use')
      if (!uses.length || out.stop_reason !== 'tool_use') break
      const results = []
      for (const u of uses) {
        let result = 'ok'
        if (u.name === 'search_products') {
          const found = await findProducts(u.input && u.input.query)
          if (found.length) products = found.slice(0, 4)
          result = found.length ? JSON.stringify(found.map((p) => ({ name: p.name, price: '$' + p.price.toFixed(2), sale: p.promo ? '$' + p.promo.toFixed(2) : undefined }))) : 'No products found for that search. Try other words, or point them to the full store.'
        }
        if (u.name === 'save_lead') {
          const r = await saveLead(u.input || {}, leadId, lang)
          if (r.ok) { leadId = r.id; result = 'Saved. Mayra will see them in her panel and reach out personally.' } else result = 'Not saved: ' + r.note
        }
        results.push({ type: 'tool_result', tool_use_id: u.id, content: result })
      }
      messages.push({ role: 'assistant', content: out.content }, { role: 'user', content: results })
    }
  } catch (e) { console.log('lola failed', e.message) }
  if (!texts.length) return json({ error: 'busy', lead_id: leadId || null })
  return json({ reply: texts.join('\n\n'), lead_id: leadId || null, products })
}

export const config = { path: '/api/lola', method: ['GET', 'POST'] }
