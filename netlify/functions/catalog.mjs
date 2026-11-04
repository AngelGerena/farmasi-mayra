// /api/catalog: search Mayra's Farmasi store from her card.
//   GET ?q=hombre            -> {products:[{name, price, promo, img, url}]}  (up to 12, Spanish or English words)
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
    const w = fold(q)
    need = SECTIONS.filter(([slug, , es, en]) => (fold(slug.replace(/-+/g, ' ') + ' ' + es + ' ' + en)).split(' ').some((t) => t.length > 2 && w.includes(t)))
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
  return json({ products: search(q, sections, 12) })
}

export const config = { path: '/api/catalog', method: ['GET'] }
