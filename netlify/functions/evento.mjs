// /api/evento
//   POST {name, phone, lang}      -> after someone saves their spot: the Zoom link, meeting ID and passcode,
//                                    plus a signed link to the calendar file.
//   GET ?lang=es&t=<signature>    -> the calendar file (.ics) with the Zoom link inside. iPhone and Android
//                                    open it straight into their calendar. Only works with the signature from POST.
import { json, stamp, stampOk } from '../../lib/auth.mjs'
import { read } from '../../lib/content.mjs'

function clean(s, n) { return String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) }
function esc(s) { return String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n') }
function z(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') }
// Calendar lines longer than 75 bytes must be folded
function fold(line) {
  const out = []; let cur = ''
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > (out.length ? 74 : 75)) { out.push(cur); cur = '' }
    cur += ch
  }
  out.push(cur)
  return out.join('\r\n ')
}

async function event() {
  const pub = await read('public')
  const ev = pub && pub.event
  if (!ev || !ev.start) return null
  const start = new Date(ev.start)
  if (isNaN(start)) return null
  const end = new Date(start.getTime() + (Number(ev.minutes) || 60) * 60000)
  if (end.getTime() < Date.now()) return null
  const j = ev.join || {}
  const url = /^https:\/\//i.test(j.url || '') ? clean(j.url, 500) : ''
  return { ev, start, end, join: { url, id: clean(j.id, 40), pass: clean(j.pass, 40) } }
}

function joinText(join, l) {
  const L = l === 'en' ? { j: 'Join on Zoom', id: 'Meeting ID', p: 'Passcode' } : { j: 'Entrar por Zoom', id: 'ID de reunión', p: 'Código de acceso' }
  return [join.url && L.j + ': ' + join.url, join.id && L.id + ': ' + join.id, join.pass && L.p + ': ' + join.pass].filter(Boolean).join('\n')
}

export default async (req) => {
  const url = new URL(req.url)
  const e = await event()

  if (req.method === 'POST') {
    let body = {}
    try { body = JSON.parse((await req.text()).slice(0, 2000)) } catch { return json({ error: 'bad_json' }, 400) }
    const name = clean(body.name, 80), phone = String(body.phone || '').replace(/\D/g, '')
    if (!name || phone.length < 10) return json({ error: 'need_name_phone' }, 400)
    if (!e) return json({ error: 'no_event' }, 404)
    const l = body.lang === 'en' ? 'en' : 'es'
    // If the site's secret isn't set, skip the server file; the page then makes a simple calendar file itself
    const t = stamp(e.ev.start)
    return json({ join: e.join, ics: t ? '/api/evento?lang=' + l + '&t=' + t : '' })
  }

  if (req.method === 'GET') {
    if (!e || !stampOk(e.ev.start, url.searchParams.get('t'))) return new Response('Not found', { status: 404 })
    const l = url.searchParams.get('lang') === 'en' ? 'en' : 'es'
    const title = (e.ev.title && (e.ev.title[l] || e.ev.title.es)) || 'Farmasi'
    const where = e.join.url || (e.ev.where && (e.ev.where[l] || e.ev.where.es)) || ''
    const about = (e.ev.about && (e.ev.about[l] || e.ev.about.es)) || ''
    const desc = [joinText(e.join, l), about, url.origin + '/evento/'].filter(Boolean).join('\n\n')
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mayra Soto Burgos//Evento//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', 'UID:' + z(e.start) + '-mayra@mayra.okunami.pro', 'DTSTAMP:' + z(new Date()),
      'DTSTART:' + z(e.start), 'DTEND:' + z(e.end), 'SUMMARY:' + esc(title), 'LOCATION:' + esc(where),
      'DESCRIPTION:' + esc(desc)]
    if (e.join.url) lines.push('URL:' + e.join.url)
    lines.push('BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(title), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR')
    return new Response(lines.map(fold).join('\r\n') + '\r\n', {
      headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': 'inline; filename=evento-mayra.ics', 'cache-control': 'no-store' }
    })
  }
  return json({ error: 'bad_request' }, 405)
}

export const config = { path: '/api/evento', method: ['GET', 'POST'] }
