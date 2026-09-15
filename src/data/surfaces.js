/**
 * The surfaces a message is actually met on.
 *
 * A design that has only ever been judged in a desktop preview has not been
 * judged. Almost all of a retention send is met once, briefly, on a locked
 * phone — and the copy that wins there is not the copy that wins in a reading
 * pane. Every surface below is a real client at a real size, with the
 * truncation point that client actually applies, so the studio can say "this
 * subject is cut at the second comma on Gmail for iOS" rather than hoping.
 *
 * `cut` is where the client stops drawing, in characters, measured on the
 * default text size. `dark` says whether that client has a dark mode worth
 * checking — Gmail's inverts, Apple Mail's does not touch a white email body.
 */
export const SURFACES = [
  /* ── Notification: where the send is actually met ────────────────── */
  {
    id: 'lock',
    label: 'Lock screen',
    device: 'iPhone 15 Pro',
    group: 'Device',
    channels: ['email', 'wa', 'sms'],
    note: 'Where most of the audience meets this, once, for about a second',
    cut: { title: 34, sub: 42, body: 120 },
    dark: false,
  },
  {
    id: 'banner',
    label: 'Banner',
    device: 'iPhone 15 Pro',
    group: 'Device',
    channels: ['email', 'wa', 'sms'],
    note: 'Two lines over whatever they were doing, gone in four seconds',
    cut: { title: 34, sub: 40, body: 84 },
    dark: true,
  },
  {
    id: 'center',
    label: 'Centre',
    device: 'iPhone 15 Pro',
    group: 'Device',
    channels: ['email', 'wa', 'sms'],
    note: 'Stacked under everything else that arrived today',
    cut: { title: 34, sub: 42, body: 96 },
    dark: false,
  },
  {
    id: 'android',
    label: 'Android',
    device: 'Pixel 8',
    group: 'Device',
    channels: ['email', 'wa', 'sms'],
    note: 'Material 3 — one line of title, one of body, until it is expanded',
    cut: { title: 42, body: 62 },
    dark: true,
  },
  {
    id: 'watch',
    label: 'Watch',
    device: 'Series 9, 45mm',
    group: 'Device',
    channels: ['email', 'wa', 'sms'],
    note: 'The hardest surface in the set: 162px of readable width',
    cut: { title: 24, body: 70 },
    dark: false,
  },

  /* ── Inbox: the list is where an email is opened or ignored ──────── */
  {
    id: 'gmail-app',
    label: 'Gmail',
    device: 'Gmail for iOS',
    group: 'Variations',
    channels: ['email'],
    note: 'Sender, subject, one line of preheader — the preheader is copy nobody wrote',
    cut: { title: 33, body: 38 },
    dark: true,
  },
  {
    id: 'gmail-open',
    label: 'Gmail, open',
    device: 'Gmail for iOS',
    group: 'Variations',
    channels: ['email'],
    note: 'The message itself, inside Gmail’s own chrome',
    cut: { title: 60 },
    dark: true,
  },
  {
    id: 'gmail-web',
    label: 'Gmail',
    device: '1440 × 900',
    group: 'Desktop',
    channels: ['email'],
    note: 'Promotions tab, reading pane, and a subject line with room to run long',
    cut: { title: 74, body: 90 },
    dark: true,
  },
  {
    id: 'apple-mail',
    label: 'Apple Mail',
    device: 'iPhone 15 Pro',
    group: 'Variations',
    channels: ['email'],
    note: 'No promotions tab and no image blocking — the friendliest read in the set',
    cut: { title: 64 },
    dark: false,
  },

  /* ── Thread: the messaging channels ──────────────────────────────── */
  {
    id: 'wa-chat',
    label: 'Chat',
    device: 'iPhone 15 Pro',
    group: 'Thread',
    channels: ['wa'],
    note: 'A business template: header, body, footer and up to two buttons',
    cut: { body: 1024 },
    dark: true,
  },
  {
    id: 'wa-list',
    label: 'Chat list',
    device: 'iPhone 15 Pro',
    group: 'Thread',
    channels: ['wa'],
    note: 'Two lines in the chat list, against every personal conversation they have',
    cut: { body: 62 },
    dark: false,
  },
  {
    id: 'wa-web',
    label: 'WhatsApp',
    device: '1440 × 900',
    group: 'Desktop',
    channels: ['wa'],
    note: 'The desktop client — wider bubble, same 1,024 character ceiling',
    cut: { body: 1024 },
    dark: false,
  },
  {
    id: 'sms-thread',
    label: 'Thread',
    device: 'iPhone 15 Pro',
    group: 'Thread',
    channels: ['sms'],
    note: 'A shortcode thread, with the segment boundary drawn where it bills',
    cut: { body: 480 },
    dark: true,
  },
  {
    id: 'sms-list',
    label: 'Thread list',
    device: 'iPhone 15 Pro',
    group: 'Thread',
    channels: ['sms'],
    note: 'Two lines beside every OTP and delivery alert they got today',
    cut: { body: 74 },
    dark: false,
  },
]

/** The surfaces available to a channel, in the order they should be judged. */
export const surfacesFor = (channel) => SURFACES.filter((s) => s.channels.includes(channel))

export const findSurface = (id) => SURFACES.find((s) => s.id === id)

/** Grouped for the picker, preserving the order above. */
export function groupedFor(channel) {
  const out = []
  for (const s of surfacesFor(channel)) {
    const g = out.find((x) => x.group === s.group)
    if (g) g.items.push(s)
    else out.push({ group: s.group, items: [s] })
  }
  return out
}

/** Where each channel opens, before the operator picks anything. */
export const DEFAULT_SURFACE = { email: 'gmail-app', wa: 'wa-chat', sms: 'sms-thread' }

/** Legacy alias — the old three-view list, kept so nothing else breaks. */
export const VIEWS = {
  email: surfacesFor('email').map((s) => ({ id: s.id, label: s.label })),
  wa: surfacesFor('wa').map((s) => ({ id: s.id, label: s.label })),
  sms: surfacesFor('sms').map((s) => ({ id: s.id, label: s.label })),
}

/**
 * Cut a string where a client stops drawing it.
 *
 * Returns the visible text and what was lost, because "your subject is 71
 * characters" is a fact the operator has to do arithmetic on, and "the
 * deadline is the part Gmail drops" is one they can act on.
 */
export function truncate(text, limit) {
  const s = String(text ?? '')
  if (!limit || s.length <= limit) return { shown: s, cut: '', truncated: false }
  return { shown: s.slice(0, limit).trimEnd(), cut: s.slice(limit), truncated: true }
}
