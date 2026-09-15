/**
 * App marks, drawn rather than fetched.
 *
 * A notification mock with a grey square where the icon goes reads as a
 * wireframe; the icon is most of what makes the surface recognisable at a
 * glance, which is exactly the glance the copy has to survive. Each mark
 * below is geometry, so it stays sharp at 16px on a watch and at 40px in a
 * reading pane, and nothing has to be loaded.
 */

/** Gmail: white envelope, the M valley cut by the coloured flap. */
export function GmailMark({ size = 38, radius }) {
  const r = radius ?? size * 0.23
  return (
    <span style={{ width: size, height: size, borderRadius: r, background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)' }}>
      <svg width={size * 0.68} height={size * 0.52} viewBox="0 0 52 37" aria-hidden="true">
        <path d="M2 6 2 5A4 4 0 0 1 6 1L26 1 26 24Z" fill="#EA4335" />
        <path d="M50 6 50 5A4 4 0 0 0 46 1L26 1 26 24Z" fill="#FBBC04" />
        <path d="M2 6 12 13.5 12 36 6 36A4 4 0 0 1 2 32Z" fill="#34A853" />
        <path d="M50 6 40 13.5 40 36 46 36A4 4 0 0 0 50 32Z" fill="#4285F4" />
      </svg>
    </span>
  )
}

/** Apple Mail: the blue gradient tile with a white envelope. */
export function MailMark({ size = 38, radius }) {
  const r = radius ?? size * 0.23
  return (
    <span style={{ width: size, height: size, borderRadius: r, background: 'linear-gradient(#22b4fb, #067ef4)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <svg width={size * 0.62} height={size * 0.44} viewBox="0 0 44 30" aria-hidden="true">
        <rect x="1" y="1" width="42" height="28" rx="4" fill="#fff" />
        <path d="M3 4 22 18 41 4" fill="none" stroke="#0a7ff0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

/** Messages: the green tile with the white bubble. */
export function MessagesMark({ size = 38, radius }) {
  const r = radius ?? size * 0.23
  return (
    <span style={{ width: size, height: size, borderRadius: r, background: 'linear-gradient(#5df675, #0cbb35)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <svg width={size * 0.62} height={size * 0.6} viewBox="0 0 32 31" aria-hidden="true">
        <path
          d="M16 2C8.3 2 2 7.2 2 13.6c0 3.6 2 6.8 5.2 8.9-.3 2.3-1.3 4.2-2.7 5.6 2.7-.3 5.2-1.4 7.1-3 1.4.3 2.9.5 4.4.5 7.7 0 14-5.2 14-11.6S23.7 2 16 2Z"
          fill="#fff"
        />
      </svg>
    </span>
  )
}

/** WhatsApp: the green tile with the handset in a bubble. */
export function WhatsAppMark({ size = 38, radius }) {
  const r = radius ?? size * 0.23
  return (
    <span style={{ width: size, height: size, borderRadius: r, background: '#25d366', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <svg width={size * 0.64} height={size * 0.64} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#fff"
          d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.86 9.86 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2Zm5.76 14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-.98.23-3.3-.69-2.78-1.1-4.54-3.94-4.68-4.13-.13-.19-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27a1 1 0 0 1 .72-.34h.52c.17 0 .39-.06.6.46.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.13.57.17.29.74 1.22 1.59 1.98 1.09.97 2 1.27 2.29 1.41.29.15.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.39-.24.65-.14.26.09 1.67.79 1.96.93.29.15.48.22.55.34.07.12.07.69-.17 1.36Z"
        />
      </svg>
    </span>
  )
}

/** Anything else on the phone that day — used for the competing rows. */
export function GenericMark({ size = 38, radius, bg = '#8e8e93', label = '' }) {
  const r = radius ?? size * 0.23
  return (
    <span
      style={{
        width: size, height: size, borderRadius: r, background: bg,
        display: 'grid', placeItems: 'center', color: '#fff', flex: 'none',
        fontSize: size * 0.42, fontWeight: 700, letterSpacing: '-0.02em',
        fontFamily: 'var(--font-ios)',
      }}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}

/** The mark a channel's notification carries. */
export function ChannelMark({ channel, client, size, radius }) {
  if (channel === 'wa') return <WhatsAppMark size={size} radius={radius} />
  if (channel === 'sms') return <MessagesMark size={size} radius={radius} />
  return client === 'apple' ? <MailMark size={size} radius={radius} /> : <GmailMark size={size} radius={radius} />
}
