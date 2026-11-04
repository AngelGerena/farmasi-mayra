// Every hour: copy the next 8 sections of Mayra's Farmasi store into the "catalog" blob store,
// then rebuild the search index. A full pass over all sections takes about 7 hours, so prices stay fresh daily.
import { SECTIONS, crawlSection, saveSection, store } from '../../lib/catalog.mjs'
import { rebuildIndex } from '../../lib/catalog-index.mjs'

const PER_RUN = 8

export default async () => {
  const s = store()
  const t0 = Date.now()
  const start = (Number(await s.get('cursor')) || 0) % SECTIONS.length
  let ok = 0, failed = 0, done = 0
  // Scheduled functions get 30 seconds. Move the bookmark after every section and stop early,
  // so one slow night at Farmasi can't freeze the refresh on the same sections forever.
  for (let i = 0; i < PER_RUN && Date.now() - t0 < 18000; i++) {
    const [slug, cid] = SECTIONS[(start + i) % SECTIONS.length]
    const products = await crawlSection(slug, cid, s)
    if (products && products.length) { await saveSection(slug, products, s); ok++ } else failed++
    done++
    await s.set('cursor', String((start + done) % SECTIONS.length))
  }
  if (Date.now() - t0 < 26000) await rebuildIndex(s)
  console.log(`catalog refresh: ${ok} sections saved, ${failed} skipped (kept last copy)`)
}

export const config = { schedule: '@hourly' }
