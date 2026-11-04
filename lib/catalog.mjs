// Mayra's Farmasi store catalog for the product search on her card.
// Farmasi's store pages carry their product list as JSON (__NEXT_DATA__ -> props.pageProps.getProductListSSR.products).
// A scheduled function copies a few sections at a time into Netlify Blobs (store "catalog"); search reads from there.
// If Farmasi changes their site, sections simply stop refreshing and the card keeps its last copy (or falls back to links).
import { getStore } from '@netlify/blobs'

export const STORE = 'https://www.farmasius.com/mayrasotoburgos'
const UA = 'Mozilla/5.0 (compatible; MayraCard/1.0; +https://mayra.okunami.pro)'

// [slug, cid, Spanish words people might type, English words]
export const SECTIONS = [
  ['new-arrivals', '369b5c56-0cf6-eb11-8337-000d3a71539d', 'nuevo novedades', 'new'],
  ['holiday-sets', 'b0f70b36-a9d4-f111-8519-02f716a02c8f', 'regalo regalos navidad set', 'gift holiday set'],
  ['mascara', '8635e0a4-60d3-eb11-a315-005056010963', 'mascara rimel pestañas ojos maquillaje', 'mascara lashes eyes makeup'],
  ['eyeliner-dipliner', '372b92ab-60d3-eb11-a315-005056010963', 'delineador ojos maquillaje', 'eyeliner eyes makeup'],
  ['eyeshadow-palettes', 'fa62ea96-60d3-eb11-a315-005056010963', 'sombras paleta ojos maquillaje', 'eyeshadow palette eyes makeup'],
  ['eye-primer', 'e7291ac0-60d3-eb11-a315-005056010963', 'primer ojos maquillaje', 'eye primer makeup'],
  ['eyebrow', '482b92ab-60d3-eb11-a315-005056010963', 'cejas maquillaje', 'brow eyebrow makeup'],
  ['liquid-lipstick', '4a4b5126-1fd8-eb11-a310-005056010959', 'labial liquido labios maquillaje', 'liquid lipstick lips makeup'],
  ['lipstick', 'ecf9ef45-61d3-eb11-a315-005056010963', 'labial pintalabios labios maquillaje', 'lipstick lips makeup'],
  ['lip-gloss', '3d235b4d-61d3-eb11-a315-005056010963', 'brillo gloss labios maquillaje', 'gloss lips makeup'],
  ['lip-liner', '55ddff54-61d3-eb11-a315-005056010963', 'delineador labios maquillaje', 'lip liner lips makeup'],
  ['lip-balm-treatment', 'd5dcff54-61d3-eb11-a315-005056010963', 'balsamo labios', 'lip balm lips'],
  ['latina-collection', '5cd895f0-5311-ef11-8497-02f716a02c8f', 'latina coleccion', 'latina collection'],
  ['bb-cc-creams', '476d9789-61d3-eb11-a315-005056010963', 'crema bb cc base maquillaje', 'bb cc cream makeup'],
  ['foundation', '30aa3182-61d3-eb11-a315-005056010963', 'base maquillaje', 'foundation makeup'],
  ['primer', 'ff359996-61d3-eb11-a315-005056010963', 'primer prebase maquillaje', 'primer makeup'],
  ['face-palettes', '536a3fc2-f4f5-ef11-84fb-02f716a02c8f', 'paleta rostro maquillaje', 'face palette makeup'],
  ['concealer', 'a9359996-61d3-eb11-a315-005056010963', 'corrector ojeras maquillaje', 'concealer makeup'],
  ['powder', 'b8c4f28f-61d3-eb11-a315-005056010963', 'polvo maquillaje', 'powder makeup'],
  ['blush', '28fac8a8-61d3-eb11-a315-005056010963', 'rubor colorete maquillaje', 'blush makeup'],
  ['bronzer', '428b1aaf-49df-eb11-a310-005056010959', 'bronceador maquillaje', 'bronzer makeup'],
  ['highlighter-contour', 'dabc33af-61d3-eb11-a315-005056010963', 'iluminador contorno maquillaje', 'highlighter contour makeup'],
  ['setting-spray-powder', 'edb742b6-61d3-eb11-a315-005056010963', 'fijador maquillaje', 'setting spray makeup'],
  ['makeup-removers', '23f03fbc-61d3-eb11-a315-005056010963', 'desmaquillante', 'makeup remover'],
  ['brushes-sponges', '4451a168-62d3-eb11-a315-005056010963', 'brochas esponjas', 'brushes sponges'],
  ['cleansers', '8b3124cc-63d3-eb11-a315-005056010963', 'limpiador limpieza piel cuidado facial', 'cleanser skin care'],
  ['serums-treatments', '587a09d6-63d3-eb11-a315-005056010963', 'serum tratamiento piel cuidado facial', 'serum treatment skin care'],
  ['face-masks', 'fd0817dc-63d3-eb11-a315-005056010963', 'mascarilla piel cuidado facial', 'mask skin care'],
  ['toners', '040a10e2-63d3-eb11-a315-005056010963', 'tonico piel cuidado facial', 'toner skin care'],
  ['eye-care', 'dc8cb0ee-63d3-eb11-a315-005056010963', 'contorno ojos ojeras piel cuidado', 'eye care skin care'],
  ['wrinkles-fine-lines', 'a6cc352d-64d3-eb11-a315-005056010963', 'arrugas lineas antiedad piel', 'wrinkles anti aging skin care'],
  ['oiliness', '2e84383d-64d3-eb11-a315-005056010963', 'grasa grasosa brillo piel', 'oily skin care'],
  ['dryness', 'a43c3c36-64d3-eb11-a315-005056010963', 'seca resequedad hidratante piel', 'dry skin care'],
  ['sensitive-skin', '3d0e8444-64d3-eb11-a315-005056010963', 'sensible piel', 'sensitive skin care'],
  ['dark-spots', '563c3c36-64d3-eb11-a315-005056010963', 'manchas piel', 'dark spots skin care'],
  ['vitamin-c', 'b1941492-8977-ef11-84f5-02f716a02c8f', 'vitamina c piel', 'vitamin c skin care'],
  ['shampoo', '6a097399-2c83-ec11-83a4-000d3a71539d', 'champu shampoo pelo cabello', 'shampoo hair'],
  ['conditioner-mask', '35571531-2383-ec11-83a4-000d3a71539d', 'acondicionador mascarilla pelo cabello', 'conditioner hair'],
  ['oils-serums-sprays', '3251b60a-65d3-eb11-a315-005056010963', 'aceite pelo cabello', 'hair oil'],
  ['hands-feet', '6b27ee6d-65d3-eb11-a315-005056010963', 'manos pies crema', 'hands feet'],
  ['soaps', '748c1867-65d3-eb11-a315-005056010963', 'jabon', 'soap'],
  ['oral-care', '8e39a08a-65d3-eb11-a315-005056010963', 'dientes pasta dental bucal', 'oral care toothpaste'],
  ['fragrances', 'a93650d8-a461-ed11-83af-000d3a71539d', 'perfume fragancia colonia', 'perfume fragrance cologne'],
  ['body-treatment', '5887a822-58f9-ec11-83ac-000d3a71539d', 'cuerpo crema corporal', 'body lotion'],
  ['men', 'cf171d76-66d3-eb11-a315-005056010963', 'hombre hombres caballero masculino', 'men man male'],
  ['weight-control', '19c9e693-aa3d-f111-8519-02f716a02c8f', 'peso bajar adelgazar control bienestar salud', 'weight loss control wellness health'],
  ['shakes-powders', '36be0314-ac3d-f111-8519-02f716a02c8f', 'batido batidos polvo proteina bienestar salud', 'shake shakes protein powder wellness health'],
  ['digestive-health', '28c9e693-aa3d-f111-8519-02f716a02c8f', 'digestion digestivo estomago bienestar salud', 'digestion digestive gut wellness health'],
  ['energy---mind', 'f2eb3f9b-aa3d-f111-8519-02f716a02c8f', 'energia mente cansancio bienestar salud', 'energy focus wellness health'],
  ['athletic-performance', 'fceb3f9b-aa3d-f111-8519-02f716a02c8f', 'ejercicio deporte gimnasio bienestar salud', 'workout athletic gym wellness health'],
  ['recovery', 'f6ce05a4-aa3d-f111-8519-02f716a02c8f', 'recuperacion bienestar salud', 'recovery wellness health'],
  ['coffees-teas', 'fa55533b-ac3d-f111-8519-02f716a02c8f', 'cafe te bienestar salud', 'coffee tea wellness health'],
  ['vitamins-boosters', '8e91f132-ac3d-f111-8519-02f716a02c8f', 'vitaminas suplementos bienestar salud', 'vitamins supplements wellness health'],
  ['gummies', 'b3189341-ac3d-f111-8519-02f716a02c8f', 'gomitas bienestar salud', 'gummies wellness health'],
  ['shots', '8c21d920-ac3d-f111-8519-02f716a02c8f', 'shots bienestar salud', 'shots wellness health'],
  ['liquids', 'dcf5b51a-ac3d-f111-8519-02f716a02c8f', 'liquidos bienestar salud', 'liquids wellness health'],
  ['targeted-systems', '0456533b-ac3d-f111-8519-02f716a02c8f', 'sistema bienestar salud', 'system wellness health'],
]
export const sectionUrl = (slug, cid) => `${STORE}/product-list/${slug}?cid=${cid}`
export const store = () => getStore({ name: 'catalog', consistency: 'strong' })

/** Pull the product list JSON out of a Farmasi store page. */
export function parsePage(html) {
  const i = html.indexOf('id="__NEXT_DATA__"')
  if (i < 0) return null
  const j = html.indexOf('>', i) + 1, k = html.indexOf('</script>', j)
  let d
  try { d = JSON.parse(html.slice(j, k)) } catch { return null }
  const p = d && d.props && d.props.pageProps && d.props.pageProps.getProductListSSR && d.props.pageProps.getProductListSSR.products
  if (!p || !Array.isArray(p.products)) return null
  return { pagination: p.pagination || {}, products: p.products.map(slim).filter(Boolean) }
}

function slim(x) {
  if (!x || !x.code || !x.name || x.discontinued) return null
  const slug = x.slugName || String(x.baseUrl || '').split('/product-list/')[1]?.split('?')[0] || ''
  if (!slug) return null
  const img = (x.images || []).find((m) => m && m.imageUrl) || {}
  const price = Number(x.retailPrice) > 0 ? Number(x.retailPrice) : Number(x.price) || 0
  const promo = Number(x.promotionalPrice) > 0 && Number(x.promotionalPrice) < price ? Number(x.promotionalPrice) : 0
  return {
    code: String(x.code), name: String(x.name).slice(0, 120), price, promo,
    img: String(img.thumbUrl || img.imageUrl || '').replace(/^http:/, 'https:'),
    url: `${STORE}/product-detail/${encodeURIComponent(slug)}?pid=${encodeURIComponent(x.code)}`,
    brand: String(x.brandName || '').slice(0, 60)
  }
}

async function get(url, ms = 9000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: ctl.signal })
    return r.ok ? await r.text() : null
  } catch { return null } finally { clearTimeout(t) }
}

/** Copy one section (all its pages) from Mayra's store. Returns the products, or null if the page could not be read. */
export async function crawlSection(slug, cid, s = store()) {
  const first = parsePage((await get(sectionUrl(slug, cid))) || '')
  if (!first) return null
  let list = first.products
  const pages = Math.min(10, Number(first.pagination.numPages) || 1)
  if (pages > 1) {
    // Farmasi's page parameter is not documented: find the one that works once and remember it
    let param = await s.get('pageparam')
    const tries = param ? [param] : ['page', 'p', 'pageIndex', 'pageNumber', 'currentPage']
    for (const name of tries) {
      const two = parsePage((await get(sectionUrl(slug, cid) + `&${name}=2`)) || '')
      if (two && Number(two.pagination.currentPage) === 2) {
        if (param !== name) await s.set('pageparam', name)
        param = name; list = list.concat(two.products)
        for (let n = 3; n <= pages; n++) {
          const more = parsePage((await get(sectionUrl(slug, cid) + `&${name}=${n}`)) || '')
          if (more) list = list.concat(more.products)
        }
        break
      }
    }
  }
  const seen = new Set()
  return list.filter((p) => !seen.has(p.code) && seen.add(p.code))
}

export async function saveSection(slug, products, s = store()) {
  await s.setJSON('section/' + slug, { at: new Date().toISOString(), products })
}

// ---------- search ----------
const fold = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
const STOP = new Set(['de', 'la', 'el', 'los', 'las', 'para', 'y', 'con', 'un', 'una', 'mi', 'the', 'for', 'and', 'a', 'of', 'productos', 'producto', 'products', 'product'])

// Spanish words -> the English words Farmasi uses in product names
const QMAP = { champu: 'shampoo', jabon: 'soap', perfume: 'edp', fragancia: 'edp', colonia: 'edp', crema: 'cream', labial: 'lipstick', rimel: 'mascara',
  pestanas: 'lash', base: 'foundation', mascarilla: 'mask', aceite: 'oil', manos: 'hand', cabello: 'hair', pelo: 'hair', ojos: 'eye', labios: 'lip',
  cuerpo: 'body', piel: 'skin', hombre: 'masculine', hombres: 'masculine', masculino: 'masculine', rubor: 'blush', brillo: 'gloss', polvo: 'powder',
  corrector: 'concealer', iluminador: 'highlighter', sombras: 'eyeshadow', cejas: 'brow', unas: 'nail', esmalte: 'nail', tonico: 'toner',
  limpiador: 'cleanser', protector: 'sun', solar: 'sun', cafe: 'coffee', te: 'tea', batido: 'shake', vitamina: 'vitamin', dientes: 'tooth', men: 'masculine' }

/** Rank products for what the person typed (Spanish or English). sections: { slug: {products} } */
export function search(q, sections, limit = 12) {
  const words = fold(q).split(' ').filter((w) => w.length > 1 && !STOP.has(w))
  if (!words.length) return []
  // each product once, with every section it appears in as tags
  const all = new Map()
  for (const [slug, , es, en] of SECTIONS) {
    const sec = sections[slug]
    if (!sec || !sec.products) continue
    const tags = fold(slug.replace(/-+/g, ' ') + ' ' + es + ' ' + en).split(' ')
    for (const p of sec.products) {
      const e = all.get(p.code) || { p, tags: new Set(), name: fold(p.name + ' ' + p.brand).split(' ') }
      tags.forEach((t) => e.tags.add(t)); all.set(p.code, e)
    }
  }
  const out = []
  for (const e of all.values()) {
    let sc = 0
    for (const w of words) {
      const vs = [w, QMAP[w]].filter(Boolean)
      if (vs.some((v) => e.name.some((n) => n === v || (v.length > 2 && n.startsWith(v))))) sc += 3
      else if (vs.some((v) => [...e.tags].some((t) => t === v || (v.length > 3 && t.length > 3 && (t.startsWith(v) || v.startsWith(t)))))) sc += 2
    }
    if (sc > 0) out.push([sc, e.p])
  }
  return out.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name)).slice(0, limit).map((x) => x[1])
}
