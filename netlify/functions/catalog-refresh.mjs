// Every hour: copy the next 8 sections of Mayra's Farmasi store into the "catalog" blob store,
// then rebuild the search index. A full pass over all sections takes about 7 hours, so prices stay fresh daily.
import { SECTIONS, crawlSection, saveSection, store } from '../../lib/catalog.mjs'
import { rebuildIndex } from '../../lib/catalog-index.mjs'

const PER_RUN = 8

export default async () => {
  const s = store()
  const start = (Number(await s.get('cursor')) || 0) % SECTIONS.length
  let ok = 0, failed = 0
  for (let i = 0; i < PER_RUN; i++) {
    const [slug, cid] = SECTIONS[(start + i) % SECTIONS.length]
    const products = await crawlSection(slug, cid, s)
    if (products && products.length) { await saveSection(slug, products, s); ok++ } else failed++
  }
  await s.set('cursor', String((start + PER_RUN) % SECTIONS.length))
  await rebuildIndex(s)
  console.log(`catalog refresh: ${ok} sections saved, ${failed} skipped (kept last copy)`)
}

export const config = { schedule: '@hourly' }
