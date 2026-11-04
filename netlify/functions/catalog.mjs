// /api/catalog: search Mayra's Farmasi store from her card.
//   GET ?q=hombre&n=12       -> {products:[{name, price, promo, img, url}]}  (12 by default, up to 24; Spanish or English words)
//   GET ?section=weight-control&n=3 -> the first n products of one store section (used by the Glow quiz)
// Reads the copy kept fresh by catalog-refresh. If a needed section was never copied yet, it copies it now.
import { SECTIONS, crawlSection, saveSection, search, store } from '../../lib/catalog.mjs'
import { readIndex, rebuildIndex } from '../../lib/catalog-index.mjs'

function json(data, status = 200, cache = 'public, max-age=300') {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache } })
}
const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default async (req) => {
  const url = new URL(req.url), s = store()
  const q = String(url.searchParams.get('q') || '').slice(0, 60)
  const section = String(url.searchParams.get('section') || '').slice(0, 60)
  let sections = await readIndex(s)

  // Sections this request needs that we do not have yet: copy up to 2 of them right now
  let need = []
  if (section) need = SECTIONS.filter(([slug]) => slug === section)
  else if (q) {
    // most specific first: "piel seca" should copy the dry-skin section before every other skin section
    const words = fold(q).split(/[^a-z0-9]+/).filter((x) => x.length > 2)
    const hits = (sec) => { const tags = fold(sec[0].replace(/-+/g, ' ') + ' ' + sec[2] + ' ' + sec[3]).split(' '); return words.filter((w) => tags.includes(w)).length }
    need = SECTIONS.map((sec) => [hits(sec), sec]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0]).map((x) => x[1])
  }
  const missing = need.filter(([slug]) => !sections[slug]).slice(0, 2)
  if (missing.length) {
    let added = false
    for (const [slug, cid] of missing) {
      const products = await crawlSection(slug, cid, s)
      if (products && products.length) { await saveSection(slug, products, s); added = true }
    }
    if (added) sections = await rebuildIndex(s)
  }

  if (section) {
    const n = Math.max(1, Math.min(12, Number(url.searchParams.get('n')) || 3))
    const sec = sections[section]
    return json({ products: sec ? sec.products.slice(0, n) : [] })
  }
  if (!q.trim()) return json({ products: [] })
  const lim = Math.max(1, Math.min(24, Number(url.searchParams.get('n')) || 12))
  return json({ products: search(q, sections, lim) })
}

export const config = { path: '/api/catalog', method: ['GET'] }
