// /api/referral: "Get your own vCard" on Mayra's card. Every request is Hiram's referral.
//   POST {name, phone, email, business, lang} -> {code}
// It is saved in OKUNAMI's reseller list (okunami-partner, action 'refer'), which emails Angel and Hiram and
// shows it on Hiram's dashboard at okunami.pro/socio. Then Angel alone gets a WhatsApp alert.
//
// Netlify environment variables (Functions scope), WhatsApp alert only (skipped if missing):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, REF_WA_TEMPLATE_SID
//   TWILIO_WA_FROM (default whatsapp:+13214555380), REF_ALERT_WHATSAPP (default whatsapp:+14079609004)
const PARTNER_API = 'https://hrwzzpmltpsqyynmmeof.supabase.co/functions/v1/okunami-partner'
const env = (k) => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || ''

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}
function clean(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) }

// WhatsApp to Angel from Paloma's Twilio number, approved template:
// {{1}} name, {{2}} what they do, {{3}} phone, {{4}} referral code, {{5}} dashboard link
async function whatsappAngel(r) {
  const sid = env('TWILIO_ACCOUNT_SID'), tok = env('TWILIO_AUTH_TOKEN'), tpl = env('REF_WA_TEMPLATE_SID')
  if (!sid || !tok || !tpl) return console.log('referral whatsapp skipped: Twilio not set')
  const v = (s) => (String(s || '-').replace(/\s+/g, ' ').trim() || '-').slice(0, 200)
  try {
    const res = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        From: env('TWILIO_WA_FROM') || 'whatsapp:+13214555380',
        To: env('REF_ALERT_WHATSAPP') || 'whatsapp:+14079609004',
        ContentSid: tpl,
        ContentVariables: JSON.stringify({ 1: v(r.name), 2: v(r.business), 3: v('+' + r.phone), 4: r.code, 5: 'https://okunami.pro/socio/' })
      })
    })
    console.log('referral whatsapp', res.status, res.ok ? '' : (await res.text()).slice(0, 200))
  } catch (e) { console.log('referral whatsapp failed', e.message) }
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'bad_request' }, 405)
  let body = {}
  try { body = JSON.parse((await req.text()).slice(0, 4000) || '{}') } catch { return json({ error: 'bad_json' }, 400) }
  if (clean(body.website, 50)) return json({ ok: true, code: 'MSB-000000' })     // honeypot: bots fill every field
  const name = clean(body.name, 80), business = clean(body.business, 120), email = clean(body.email, 120).toLowerCase()
  let phone = String(body.phone || '').replace(/\D/g, '')
  if (phone.length === 10) phone = '1' + phone
  if (!name || phone.length < 11 || phone.length > 15) return json({ error: 'need_name_phone' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'need_email' }, 400)

  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || ''
  let saved
  try {
    const r = await fetch(PARTNER_API, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(ip ? { 'x-forwarded-for': ip } : {}) },
      body: JSON.stringify({ action: 'refer', reseller: 'hiram-diaz', via: 'mayra-card', lang: body.lang === 'en' ? 'en' : 'es',
        lead: { full_name: name, phone, email, business_type: business } })
    })
    saved = await r.json().catch(() => ({}))
    if (r.status === 429) return json({ error: 'busy' }, 429)
    if (!r.ok || !saved.code) throw new Error('okunami ' + r.status + ' ' + JSON.stringify(saved).slice(0, 120))
  } catch (e) {
    console.log('referral save failed', e.message)
    return json({ error: 'server' }, 502)
  }
  await whatsappAngel({ name, business, phone, code: saved.code })
  return json({ ok: true, code: saved.code })
}

export const config = { path: '/api/referral', method: ['POST'] }
