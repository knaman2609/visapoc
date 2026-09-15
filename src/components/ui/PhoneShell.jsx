import styles from './PhoneShell.module.css'

/**
 * A handset frame for message mocks.
 *
 * `chrome="ios"` adds the Dynamic Island, the real status-bar glyphs and the
 * home indicator; `chrome="android"` swaps them for a punch-hole camera, a
 * left-aligned clock and a gesture bar. Both are opt-in because they overlay
 * the screen, and the older mocks lay their own content right up to those
 * edges.
 *
 * `tone` is the colour of the status bar itself: dark glyphs on a light
 * screen, light glyphs on a lock screen or a dark client. Getting this wrong
 * is the single most obvious tell that a mock is a mock.
 */
export default function PhoneShell({
  size = 'md',
  time = '9:41',
  screenBg = '#eef0f3',
  showStatusBar = true,
  chrome = 'plain',
  tone = 'dark',
  children,
}) {
  const isSm = size === 'sm'
  const ios = chrome === 'ios'
  const android = chrome === 'android'
  const framed = ios || android

  return (
    <div className={`${styles.bezel} ${styles[size]} ${framed ? styles.bezelIos : ''}`}>
      <div
        className={`${styles.screen} ${isSm ? styles.smScreen : ''}`}
        style={{ background: screenBg }}
      >
        {showStatusBar && (
          <div
            className={[
              styles.statusBar,
              isSm ? styles.smBar : '',
              ios ? styles.statusIos : '',
              android ? styles.statusAndroid : '',
              tone === 'light' ? styles.statusLight : '',
            ].filter(Boolean).join(' ')}
          >
            <div className={ios ? styles.timeIos : undefined}>{time}</div>
            {ios && <div className={styles.island} aria-hidden="true" />}
            {android && <div className={styles.punch} aria-hidden="true" />}
            <div className={styles.statusRight}>
              {framed ? <StatusGlyphs /> : <div className={`${styles.batt} ${isSm ? styles.smBatt : ''}`} />}
            </div>
          </div>
        )}

        {children}

        {ios && <div className={`${styles.homeBar} ${tone === 'light' ? styles.homeLight : ''}`} aria-hidden="true" />}
        {android && <div className={`${styles.gestureBar} ${tone === 'light' ? styles.homeLight : ''}`} aria-hidden="true" />}
      </div>
    </div>
  )
}

/* Cellular, wi-fi and battery, drawn small enough to read as iOS rather than
   as icons. currentColor so the bar can sit on a light or dark screen. */
function StatusGlyphs() {
  return (
    <>
      <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.3} y={7.4 - i * 2.2} width="3" height={3.6 + i * 2.2} rx="1" fill="currentColor" />
        ))}
      </svg>
      <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden="true" fill="none" stroke="currentColor">
        <path d="M7.5 9.9 5.7 8a2.7 2.7 0 0 1 3.6 0Z" fill="currentColor" stroke="none" />
        <path d="M3.8 6.1a5.4 5.4 0 0 1 7.4 0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M1.7 3.7a8.4 8.4 0 0 1 11.6 0" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
        <rect x="0.6" y="0.6" width="20.8" height="10.8" rx="3.2" fill="none" stroke="currentColor" strokeOpacity=".35" />
        <rect x="2.2" y="2.2" width="15" height="7.6" rx="1.9" fill="currentColor" />
        <path d="M23.2 4.3v3.4a1.9 1.9 0 0 0 0-3.4Z" fill="currentColor" fillOpacity=".35" />
      </svg>
    </>
  )
}
