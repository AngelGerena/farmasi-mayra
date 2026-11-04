// /api/referral: people who ask for their own vCard from Mayra's card. Each one is Hiram's referral.
//   POST {name, phone, business, lang}      -> anyone (the "Get your own vCard" form). Saves the referral,
//                                              emails Angel and Hiram, WhatsApps Angel. Returns {code}.
//   POST ?login {pin}                        -> {token, role}. Angel's PIN = admin, Hiram's PIN = partner (read only).
//   GET  (token)                             -> {role, referrals, totals}
//   PATCH (admin token) {id, status, amount, note} -> update; marking "sold" emails Angel and Hiram.
//
// Netlify environment variables (Functions scope):
//   REF_PIN_ANGEL, REF_PIN_HIRAM   sign-in PINs for the Referrals page (SESSION_SECRET signs the sessions)
//   RESEND_API_KEY                 email alerts (sent from REF_ALERT_FROM, default "OKUNAMI <hello@okunami.pro>")
//   REF_EMAILS                     who gets the emails (default angel@finessemedia.pro,hiramdiazm@gmail.com)
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, REF_WA_TEMPLATE_SID   WhatsApp alert to Angel only
//   TWILIO_WA_FROM (default whatsapp:+13214555380), REF_ALERT_WHATSAPP (default whatsapp:+14079609004)
// Anything missing is skipped quietly: the referral is still saved.
import { getStore } from '@netlify/blobs'
import { createHmac, createHash, timingSafeEqual, randomUUID } from 'node:crypto'

const SITE = 'https://mayra.okunami.pro'
const COMMISSION = 0.4          // Hiram: 40% of the first-year payment ("40 now, 20 forever")
const STATUSES = ['new', 'contacted', 'sold', 'lost']
const store = () => getStore({ name: 'equipo', consistency: 'strong' })
const env = (k) => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || ''

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}
function clean(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]) }
function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2) }
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y) }
function hmac(v, k) { return createHmac('sha256', k).update(v).digest('base64url') }

// ---------- sessions: the PIN is part of the key, so changing a PIN signs that person out ----------
function keyFor(role) {
  const pin = env(role === 'admin' ? 'REF_PIN_ANGEL' : 'REF_PIN_HIRAM'), secret = env('SESSION_SECRET')
  return pin && secret ? secret + ':ref:' + role + ':' + pin : null
}
function makeToken(role) { const exp = String(Date.now() + 30 * 864e5); return role + '.' + exp + '.' + hmac(role + exp, keyFor(role)) }
function roleOf(req) {
  const [role, exp, sig] = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.')
  if (!['admin', 'partner'].includes(role) || !(Number(exp) > Date.now())) return null
  const k = keyFor(role)
  return k && same(sig || '', hmac(role + exp, k)) ? role : null
}
function pinRole(pin) {
  const p = String(pin || '').trim()
  if (!p) return null
  const a = env('REF_PIN_ANGEL'), h = env('REF_PIN_HIRAM')
  const d = (x) => hmac(x, 'ref-pin-check')
  if (a && same(d(p), d(a))) return 'admin'
  if (h && same(d(p), d(h))) return 'partner'
  return null
}

// ---------- small abuse guards ----------
async function limited(s, name, max, minutes) {
  const k = 'refrate/' + name + '/' + Math.floor(Date.now() / (minutes * 60000))
  const n = Number(await s.get(k)) || 0
  if (n >= max) return true
  await s.set(k, String(n + 1))
  return false
}
function ipKey(req) {
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'x'
  return createHash('sha256').update(ip.split(',')[0].trim()).digest('hex').slice(0, 16)
}

async function nextCode(s) {
  const n = (Number(await s.get('refseq')) || 0) + 1
  await s.set('refseq', String(n))
  return 'MSB-' + String(n).padStart(4, '0')
}

// ---------- alerts ----------
async function email(subject, lines, button) {
  const key = env('RESEND_API_KEY')
  if (!key) return console.log('referral email skipped: no RESEND_API_KEY')
  const to = (env('REF_EMAILS') || 'angel@finessemedia.pro,hiramdiazm@gmail.com').split(',').map((x) => x.trim()).filter(Boolean)
  const html = '<div style="font:15px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#2D354E;max-width:520px">' +
    lines.map((l) => '<p style="margin:0 0 10px">' + esc(l) + '</p>').join('') +
    (button ? '<p><a href="' + esc(button.href) + '" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#FF5A68;color:#fff;text-decoration:none;font-weight:700">' + esc(button.label) + '</a></p>' : '') +
    '<p><a href="' + SITE + '/referidos/">' + 'Ver referidos / See referrals' + '</a></p></div>'
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env('REF_ALERT_FROM') || 'OKUNAMI <hello@okunami.pro>', to, reply_to: 'angel@finessemedia.pro', subject,
        text: lines.join('\n') + (button ? '\n\n' + button.label + ': ' + button.href : '') + '\n\n' + SITE + '/referidos/', html })
    })
    console.log('referral email', r.status, r.ok ? '' : (await r.text()).slice(0, 200))
  } catch (e) { console.log('referral email failed', e.message) }
}

// WhatsApp alert to Angel only, from Paloma's Twilio number, using an approved template:
// {{1}} name, {{2}} what they do, {{3}} phone, {{4}} referral code, {{5}} referrals page
async function whatsappAngel(ref) {
  const sid = env('TWILIO_ACCOUNT_SID'), tok = env('TWILIO_AUTH_TOKEN'), tpl = env('REF_WA_TEMPLATE_SID')
  if (!sid || !tok || !tpl) return console.log('referral whatsapp skipped: Twilio not set')
  const v = (s) => (String(s || '-').replace(/\s+/g, ' ').trim() || '-').slice(0, 200)
  try {
    const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        From: env('TWILIO_WA_FROM') || 'whatsapp:+13214555380',
        To: env('REF_ALERT_WHATSAPP') || 'whatsapp:+14079609004',
        ContentSid: tpl,
        ContentVariables: JSON.stringify({ 1: v(ref.name), 2: v(ref.business), 3: v('+' + ref.phone), 4: ref.code, 5: SITE + '/referidos/' })
      })
    })
    console.log('referral whatsapp', r.status, r.ok ? '' : (await r.text()).slice(0, 200))
  } catch (e) { console.log('referral whatsapp failed', e.message) }
}

async function all(s) {
  const { blobs } = await s.list({ prefix: 'ref/' })
  const out = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))
  return out.filter(Boolean).sort((a, b) => String(b.created).localeCompare(String(a.created)))
}
function totals(list) {
  const sold = list.filter((r) => r.status === 'sold')
  const sales = sold.reduce((t, r) => t + (Number(r.amount) || 0), 0)
  return { referrals: list.length, sold: sold.length, sales, commission: Math.round(sales * COMMISSION * 100) / 100, rate: COMMISSION }
}

export default async (req) => {
  const url = new URL(req.url), s = store()
  let body = {}
  if (req.method !== 'GET') {
    const raw = (await req.text()).slice(0, 4000)
    try { body = raw ? JSON.parse(raw) : {} } catch { return json({ error: 'bad_json' }, 400) }
  }

  // Sign in to the Referrals page
  if (req.method === 'POST' && url.searchParams.has('login')) {
    const ip = ipKey(req)
    if (await limited(s, 'login-' + ip, 5, 15)) return json({ error: 'locked' }, 429)
    const role = pinRole(body.pin)
    if (!role || !keyFor(role)) return json({ error: 'wrong_pin' }, 401)
    return json({ token: makeToken(role), role })
  }

  // New referral from the "Get your own vCard" form
  if (req.method === 'POST') {
    if (clean(body.website, 50)) return json({ ok: true, code: 'MSB-0000' })     // honeypot: bots fill every field
    const name = clean(body.name, 80), business = clean(body.business, 120)
    let phone = String(body.phone || '').replace(/\D/g, '')
    if (phone.length === 10) phone = '1' + phone
    if (!name || phone.length < 11 || phone.length > 15) return json({ error: 'need_name_phone' }, 400)
    if (await limited(s, 'new-' + ipKey(req), 6, 60) || await limited(s, 'new-all', 60, 60 * 24)) return json({ error: 'busy' }, 429)
    const ref = {
      id: randomUUID(), code: await nextCode(s), partner: 'hiram', source: 'mayra-card',
      name, phone, business, lang: body.lang === 'en' ? 'en' : 'es',
      status: 'new', amount: 0, note: '', created: new Date().toISOString(), soldAt: null
    }
    await s.setJSON('ref/' + ref.id, ref)
    await Promise.all([
      email('Nuevo referido ' + ref.code + ': ' + name + ' (tarjeta de Mayra)', [
        'Nuevo referido de Hiram desde la tarjeta de Mayra Soto Burgos.',
        'Código: ' + ref.code, 'Nombre: ' + name, 'Negocio: ' + (business || '-'), 'WhatsApp: +' + phone,
        'Fecha: ' + new Date(ref.created).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })
      ], { label: 'Escribirle por WhatsApp', href: 'https://wa.me/' + phone }),
      whatsappAngel(ref)
    ])
    return json({ ok: true, code: ref.code })
  }

  const role = roleOf(req)
  if (!role) return json({ error: 'auth' }, 401)

  if (req.method === 'GET') {
    const list = await all(s)
    // Hiram sees who and where things stand, without customers' phone numbers
    const view = role === 'admin' ? list : list.map(({ phone, ...r }) => ({ ...r, phone: phone ? '••• ' + String(phone).slice(-4) : '' }))
    return json({ role, referrals: view, totals: totals(list) })
  }

  if (req.method === 'PATCH') {
    if (role !== 'admin') return json({ error: 'admin_only' }, 403)
    const id = String(body.id || '').replace(/[^\w-]/g, '').slice(0, 64)
    const ref = id && await s.get('ref/' + id, { type: 'json' })
    if (!ref) return json({ error: 'not_found' }, 404)
    const was = ref.status
    if (STATUSES.includes(body.status)) ref.status = body.status
    if (body.amount != null) ref.amount = Math.max(0, Math.min(100000, Math.round(Number(body.amount) * 100) / 100 || 0))
    if (body.note != null) ref.note = clean(body.note, 500)
    if (ref.status === 'sold' && !(ref.amount > 0)) return json({ error: 'need_amount' }, 400)
    ref.soldAt = ref.status === 'sold' ? (ref.soldAt || new Date().toISOString()) : null
    await s.setJSON('ref/' + id, ref)
    if (ref.status === 'sold' && was !== 'sold') {
      await email('Venta cerrada ' + ref.code + ': ' + ref.name + ' · ' + money(ref.amount), [
        '¡Venta cerrada de un referido de Hiram!',
        'Código: ' + ref.code, 'Cliente: ' + ref.name + (ref.business ? ' (' + ref.business + ')' : ''),
        'Venta: ' + money(ref.amount), 'Comisión de Hiram (40%): ' + money(ref.amount * COMMISSION)
      ])
    }
    return json({ ok: true, referral: ref, totals: totals(await all(s)) })
  }
  return json({ error: 'bad_request' }, 405)
}

export const config = { path: '/api/referral', method: ['GET', 'POST', 'PATCH'] }
