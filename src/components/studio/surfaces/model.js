import { render } from '../../../data/templates.js'
import { blockText } from '../../../data/blocks.js'

/**
 * What a surface actually has to draw, per channel.
 *
 * A push notification is not the message — it is three strings the client
 * assembles from whatever the sender put in the envelope. Mail puts the
 * sender in the title, the subject in the subtitle and the preheader in the
 * body; WhatsApp puts the business name in the title and the whole template
 * in the body; a shortcode SMS has no title at all beyond its own header.
 * Getting that mapping right is the difference between a mock and a preview.
 */
export function notifModel(channel, tpl, fields, merged, brand) {
  const show = (t) => (merged ? render(t ?? '', fields) : (t ?? ''))

  if (channel === 'email') {
    const blocks = tpl.blocks || []
    const first = blocks.find((b) => b.type === 'text' || b.type === 'heading')
    return {
      app: 'Gmail',
      sender: brand?.sender || 'Visa Cards',
      title: brand?.sender || 'Visa Cards',
      subtitle: show(tpl.subject),
      body: show(tpl.preheader || (first ? blockText(first) : '')),
      when: 'now',
    }
  }
  if (channel === 'wa') {
    return {
      app: 'WhatsApp',
      sender: brand?.sender || 'Visa Cards',
      title: brand?.sender || 'Visa Cards',
      subtitle: '',
      body: [show(tpl.header), show(tpl.body)].filter(Boolean).join('\n'),
      when: 'now',
    }
  }
  return {
    app: 'Messages',
    sender: 'VM-VISAIN',
    title: 'VM-VISAIN',
    subtitle: '',
    body: show(tpl.body),
    when: 'now',
  }
}

/* ── What the message is actually competing with ───────────────────────
   An inbox row judged on its own always looks fine. Judged in a list of the
   other eleven promotional emails that arrived the same morning, most subject
   lines stop looking like the one worth opening — which is the point of
   drawing the neighbours at all. Everything below is the traffic a card
   customer in an Indian metro genuinely gets. */

export const GMAIL_ROWS = [
  { from: 'Swiggy', subject: '₹150 off your next 3 orders', snippet: 'Ends tonight. Use code SWIGGY150 at checkout…', when: '08:52', hue: '#fc8019', unread: true },
  { from: 'MakeMyTrip', subject: 'Prices dropped on your Goa search', snippet: 'Flights from ₹4,299 — 4 seats left at this fare…', when: '08:14', hue: '#eb2026' },
  { from: 'Myntra', subject: 'End of Reason Sale — 50–80% off', snippet: 'Your size is back in stock in 14 saved items…', when: '07:40', hue: '#ff3f6c', unread: true },
  { from: 'Cred', subject: 'Your September statement is ready', snippet: 'Pay by 18 Sep to keep your streak…', when: 'Yesterday', hue: '#0b0b0f' },
  { from: 'Amazon.in', subject: 'Delivered: Sony WH-1000XM5', snippet: 'Your package was handed to a resident…', when: 'Yesterday', hue: '#232f3e' },
  { from: 'Cleartrip', subject: 'Fare alert: BOM → SIN', snippet: 'Down ₹3,100 since you last looked…', when: 'Mon', hue: '#f47521' },
]

export const IOS_NOTIFS = [
  { app: 'WhatsApp', title: 'Aarti Menon', body: 'sending the deck now, one sec', when: '9m ago', kind: 'wa' },
  { app: 'Swiggy', title: 'Order on the way', body: 'Ramesh is 4 minutes away with your order.', when: '18m ago', kind: 'swiggy' },
  { app: 'Calendar', title: 'Portfolio review', body: '10:00 – 10:45 · Meeting room 4', when: '22m ago', kind: 'cal' },
  { app: 'Messages', title: 'HDFCBK', body: 'Rs.2,480.00 debited from a/c XX4417 on 07-09-26.', when: '31m ago', kind: 'sms' },
]

export const WA_CHATS = [
  { name: 'Aarti Menon', last: 'sending the deck now, one sec', when: '09:04', hue: '#7f8c8d' },
  { name: 'Building 3B · Residents', last: 'Rakesh: water tanker at 4pm today', when: '08:31', hue: '#16a085' },
  { name: 'Swiggy', last: 'Your order has been delivered 🛵', when: 'Yesterday', hue: '#fc8019' },
  { name: 'Amma', last: 'Voice message (0:42)', when: 'Yesterday', hue: '#c0392b' },
]

export const SMS_THREADS = [
  { name: 'HDFCBK', last: 'Rs.2,480.00 debited from a/c XX4417 on 07-09-26 to SWIGGY. Not you? Call 18002586161.', when: '08:33' },
  { name: 'AD-UBERIN', last: 'Your ride with Sandeep is arriving. KA 01 AB 4417, white Dzire.', when: 'Yesterday' },
  { name: 'JD-AIRTEL', last: 'Your Airtel bill of Rs.899 is due on 12-09-26. Pay now: airtel.in/pay', when: 'Yesterday' },
  { name: 'VM-CLTRIP', last: 'OTP 449182 for your booking. Valid 10 minutes. Do not share.', when: 'Mon' },
]

/**
 * What a client puts where a subject should be.
 *
 * Both of these draw a placeholder rather than a blank line, and an empty
 * subject is a state the studio reaches the moment somebody starts a design —
 * so leaving a gap there reads as a broken renderer.
 */
export const NO_SUBJECT = { gmail: '(no subject)', apple: 'No Subject' }
export const subjectOr = (text, client) => (
  String(text ?? '').trim() ? text : NO_SUBJECT[client]
)

/** The email chrome shows a real-looking address, not a placeholder. */
export const senderAddress = (brand) => brand?.senderAddress || 'cards@visa.example.co.in'

/**
 * A template with nothing in it.
 *
 * Drawing the bubble anyway leaves a white sliver with a timestamp floating in
 * it, which reads as a broken renderer rather than as an empty document. An
 * empty chat is a real state, so the canvas draws one.
 */
export const waEmpty = (tpl = {}) => (
  !String(tpl.header || '').trim()
  && !String(tpl.body || '').trim()
  && !String(tpl.footer || '').trim()
  && !(tpl.buttons || []).length
)

/** Whichever channel it is, whether there is anything to look at yet. */
export const docEmpty = (channel, tpl = {}) => {
  if (channel === 'email') return !(tpl.blocks || []).length
  if (channel === 'wa') return waEmpty(tpl)
  return !String(tpl.body || '').trim()
}

/** First letter for the avatar circles the clients draw. */
export const initial = (s) => String(s || '?').trim().charAt(0).toUpperCase()
