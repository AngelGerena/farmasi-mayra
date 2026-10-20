// Every verified "quiz-leads" form submission (call requests and event RSVPs) becomes a lead on Mayra's team page.
// Netlify signs and verifies form events, so this cannot be called from outside.
import { getStore } from '@netlify/blobs'
import { randomUUID } from 'node:crypto'

function field(d, k) {
  return String(d[k] == null ? '' : d[k]).trim().slice(0, 2000)
}

export default {
  async formSubmitted(event) {
    const d = (event && event.data) || {}
    if (field(d, 'bot-field')) return
    const digits = field(d, 'phone').replace(/\D/g, '')
    const id = randomUUID()
    const lead = {
      id,
      origin: 'quiz',
      name: field(d, 'name'),
      phone: digits.length === 10 ? '1' + digits : digits,
      quiz: field(d, 'quiz'),
      result: field(d, 'result'),
      lang: field(d, 'lang') === 'en' ? 'en' : 'es',
      source: field(d, 'source') || 'direct',
      products: field(d, 'products'),
      answers: field(d, 'answers'),
      stage: 'new',
      step: 0,
      created: new Date().toISOString(),
      lastContact: null,
      notes: ''
    }
    await getStore({ name: 'equipo', consistency: 'strong' }).setJSON('lead/' + id, lead)
  }
}
