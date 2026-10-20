// Shared helpers for Mayra's team page: PIN check and signed session tokens.
// OWNER_PIN and SESSION_SECRET are Netlify environment variables (scope: Functions). Never in code.
import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_DAYS = 30

function key() {
  const secret = Netlify.env.get('SESSION_SECRET')
  const pin = Netlify.env.get('OWNER_PIN')
  if (!secret || !pin) return null
  // The PIN is part of the signing key, so changing the PIN signs everyone out.
  return secret + ':' + pin
}

function sign(value, k) {
  return createHmac('sha256', k).update(value).digest('base64url')
}

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

export function configured() {
  return key() !== null
}

export function pinMatches(pin) {
  const real = Netlify.env.get('OWNER_PIN') || ''
  // Compare fixed-length digests so the check takes the same time for any input
  return same(sign(String(pin), 'pin-check'), sign(real, 'pin-check'))
}

export function makeToken() {
  const exp = String(Date.now() + SESSION_DAYS * 864e5)
  return exp + '.' + sign(exp, key())
}

export function hasValidToken(req) {
  const k = key()
  if (!k) return false
  const raw = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const [exp, sig] = raw.split('.')
  if (!exp || !sig || !(Number(exp) > Date.now())) return false
  return same(sig, sign(exp, k))
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  })
}
