// One combined blob ("index") so a search reads a single file instead of ~60.
import { SECTIONS, store } from './catalog.mjs'

export async function rebuildIndex(s = store()) {
  const sections = {}
  await Promise.all(SECTIONS.map(async ([slug]) => {
    const sec = await s.get('section/' + slug, { type: 'json' })
    if (sec && sec.products) sections[slug] = { at: sec.at, products: sec.products }
  }))
  await s.setJSON('index', { at: new Date().toISOString(), sections })
  return sections
}

export async function readIndex(s = store()) {
  const idx = await s.get('index', { type: 'json' })
  return (idx && idx.sections) || {}
}
