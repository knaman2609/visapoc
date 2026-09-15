import { Camera, ChevronDown, Flashlight, Lock } from 'lucide-react'
import PhoneShell from '../../ui/PhoneShell.jsx'
import Markup from './Markup.jsx'
import {
  ChannelMark, GenericMark, GmailMark, MessagesMark, WhatsAppMark,
} from './AppIcons.jsx'
import { IOS_NOTIFS } from './model.js'
import styles from './NotifSurfaces.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')

/**
 * The iOS notification card.
 *
 * Three strings, in the order the system draws them: title semibold, an
 * optional subtitle in the same weight, then the body. The app name is not
 * repeated — modern iOS shows it only as a group header in the notification
 * centre — and the timestamp sits at the top right in the secondary colour.
 * Everything is capped by the client rather than by CSS overflow, so what
 * gets dropped is visible rather than silently gone.
 */
export function NotifCard({ n, channel, cut = {}, merged, tone = 'glass', compact }) {
  return (
    <div className={cx(styles.card, styles[tone], compact && styles.cardSm)}>
      <span className={styles.cardIcon}>
        <ChannelMark channel={channel} size={compact ? 30 : 38} />
      </span>
      <span className={styles.cardText}>
        <span className={styles.cardTop}>
          <b><Markup text={n.title} merged={merged} cut={cut.title} showCut={false} /></b>
          <i>{n.when}</i>
        </span>
        {n.subtitle ? (
          <span className={styles.cardSub}>
            <Markup text={n.subtitle} merged={merged} cut={cut.sub} />
          </span>
        ) : null}
        <span className={styles.cardBody}>
          <Markup text={n.body} merged={merged} cut={cut.body} />
        </span>
      </span>
    </div>
  )
}

/**
 * The lock screen.
 *
 * The surface almost every send is actually met on, and the one that decides
 * whether any of the rest matters. The stack behind the card is real
 * behaviour — a notification arriving into a pile is a different read from
 * one arriving alone — and the wallpaper is dark because that is what makes
 * the card the only lit thing on the screen.
 */
export function IosLock({ n, channel, merged, surface }) {
  return (
    <PhoneShell size="lg" chrome="ios" tone="light" time="9:41" screenBg="#0b1020">
      <div className={styles.lock}>
        <div className={styles.wall} aria-hidden="true">
          <span className={styles.wallA} /><span className={styles.wallB} /><span className={styles.wallC} />
        </div>

        <div className={styles.lockTop}>
          <Lock size={13} strokeWidth={2.4} className={styles.padlock} aria-hidden="true" />
          <span className={styles.lockDate}>Monday, 7 September</span>
          <span className={styles.lockTime}>9:41</span>
        </div>

        <div className={styles.lockWidgets} aria-hidden="true">
          <span className={styles.widget}><b>Mumbai</b><i>31° Mostly clear</i></span>
          <span className={styles.widget}><b>10:00</b><i>Portfolio review</i></span>
        </div>

        <div className={styles.lockStack}>
          {/* Two cards peeking behind, because a notification never lands on an
              empty lock screen at nine in the morning. */}
          <div className={styles.behind2} aria-hidden="true" />
          <div className={styles.behind1} aria-hidden="true" />
          <NotifCard n={n} channel={channel} cut={surface?.cut} merged={merged} />
          <span className={styles.stackCount}>2 more notifications</span>
        </div>

        <div className={styles.lockBottom}>
          <span className={styles.lockBtn}><Flashlight size={17} strokeWidth={2} aria-hidden="true" /></span>
          <span className={styles.lockBtn}><Camera size={17} strokeWidth={2} aria-hidden="true" /></span>
        </div>
      </div>
    </PhoneShell>
  )
}

/* A home screen worth interrupting: real-looking tiles and a dock, so the
   banner reads as an intrusion rather than as a card on grey. */
const HOME_APPS = [
  ['#3478f6', 'FaceTime'], ['#34c759', 'Messages'], ['#5ac8fa', 'Weather'], ['#ff9500', 'Notes'],
  ['#ff3b30', 'YouTube'], ['#0a84ff', 'Maps'], ['#af52de', 'Podcasts'], ['#ff2d55', 'Music'],
  ['#fc8019', 'Swiggy'], ['#0b0b0f', 'Cred'], ['#eb2026', 'MMT'], ['#25d366', 'WhatsApp'],
  ['#1d9bf0', 'X'], ['#e1306c', 'Instagram'], ['#276ef1', 'Uber'], ['#0f9d58', 'Sheets'],
  ['#5f6368', 'Settings'], ['#34aadc', 'Photos'], ['#ffcc00', 'Reminders'], ['#8e8e93', 'Files'],
]

/** A banner over whatever they were already doing. */
export function IosBanner({ n, channel, merged, surface, dark }) {
  return (
    <PhoneShell size="lg" chrome="ios" tone="light" time="9:41" screenBg={dark ? '#101014' : '#2c3350'}>
      <div className={cx(styles.home, dark && styles.homeDark)}>
        <div className={styles.homeWall} aria-hidden="true" />
        <div className={styles.bannerSlot}>
          <NotifCard n={n} channel={channel} cut={surface?.cut} merged={merged}
            tone={dark ? 'sheetDark' : 'sheet'} />
        </div>

        <div className={styles.homeGrid} aria-hidden="true">
          {HOME_APPS.map(([hue, name]) => (
            <span key={name} className={styles.homeApp}>
              <i style={{ background: hue }} />
              <em>{name}</em>
            </span>
          ))}
        </div>

        <div className={styles.dots} aria-hidden="true"><i /><i /><i /></div>

        <div className={styles.dock} aria-hidden="true">
          {['#3478f6', '#34c759', '#ff9500', '#0a84ff'].map((hue) => (
            <span key={hue} style={{ background: hue }} />
          ))}
        </div>
      </div>
    </PhoneShell>
  )
}

const OTHER_MARK = {
  wa: <WhatsAppMark size={30} />,
  sms: <MessagesMark size={30} />,
  swiggy: <GenericMark size={30} bg="#fc8019" label="S" />,
  cal: <GenericMark size={30} bg="#fff" label="7" />,
}

/**
 * Notification centre.
 *
 * The pile the message lands in if it is not read within the minute. Drawing
 * the other four things that arrived this morning is the only honest way to
 * ask whether this one still reads as worth opening.
 */
export function IosCenter({ n, channel, merged, surface }) {
  return (
    <PhoneShell size="lg" chrome="ios" tone="light" time="9:41" screenBg="#0b1020">
      <div className={styles.centre}>
        <div className={styles.wall} aria-hidden="true">
          <span className={styles.wallA} /><span className={styles.wallB} /><span className={styles.wallC} />
        </div>
        <div className={styles.centreScrim} aria-hidden="true" />

        <div className={styles.centreHead}>
          <span className={styles.centreDate}>Monday, 7 September</span>
          <span className={styles.centreTitle}>Notification Centre</span>
        </div>

        <div className={styles.centreList}>
          <span className={styles.groupHead}>
            {channel === 'email' ? <GmailMark size={15} /> : <ChannelMark channel={channel} size={15} />}
            {n.app}
          </span>
          <NotifCard n={n} channel={channel} cut={surface?.cut} merged={merged} />

          {IOS_NOTIFS.map((o) => (
            <div key={o.title} className={cx(styles.card, styles.glass, styles.cardSm)}>
              <span className={styles.cardIcon}>{OTHER_MARK[o.kind]}</span>
              <span className={styles.cardText}>
                <span className={styles.cardTop}><b>{o.title}</b><i>{o.when}</i></span>
                <span className={styles.cardBody}>{o.body}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  )
}

/**
 * The Android shade, Material 3.
 *
 * Android collapses a notification to one line of title and one of body until
 * it is expanded, and it tints the app icon monochrome — so a message that
 * relies on its second sentence loses that sentence here.
 */
export function AndroidShade({ n, channel, merged, surface, dark }) {
  const cut = surface?.cut || {}
  return (
    <PhoneShell size="lg" chrome="android" tone="light" time="9:41" screenBg={dark ? '#101014' : '#1b1c1e'}>
      <div className={cx(styles.shade, dark && styles.shadeDark)}>
        <div className={styles.shadeWall} aria-hidden="true" />

        <div className={styles.qs}>
          <span className={styles.qsClock}>9:41</span>
          <span className={styles.qsDate}>Mon, 7 Sep</span>
          <span className={styles.qsTiles} aria-hidden="true">
            {['Wi-Fi', 'Data', 'DND', 'Torch'].map((t, i) => (
              <span key={t} className={cx(styles.qsTile, i < 2 && styles.qsOn)}>{t}</span>
            ))}
          </span>
        </div>

        <div className={styles.aCard}>
          <span className={styles.aHead}>
            <ChannelMark channel={channel} size={15} radius={4} />
            <b>{n.app}</b>
            <em>·</em>
            <i>now</i>
            <ChevronDown size={15} strokeWidth={2} className={styles.aChev} aria-hidden="true" />
          </span>
          <span className={styles.aTitle}>
            <Markup text={n.subtitle || n.title} merged={merged} cut={cut.title} showCut={false} />
          </span>
          <span className={styles.aBody}>
            <Markup text={n.body} merged={merged} cut={cut.body} showCut={false} />
          </span>
          <span className={styles.aActions}>
            <span>Archive</span><span>Mark as read</span>
          </span>
        </div>

        {IOS_NOTIFS.slice(0, 2).map((o) => (
          <div key={o.title} className={cx(styles.aCard, styles.aCardIdle)}>
            <span className={styles.aHead}>
              <GenericMark size={15} radius={4} bg="#8e8e93" label="" />
              <b>{o.app}</b><em>·</em><i>{o.when}</i>
            </span>
            <span className={styles.aTitle}>{o.title}</span>
            <span className={styles.aBody}>{o.body}</span>
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}

/**
 * Apple Watch, long look.
 *
 * 162 points of readable width. Anything that has not said what it is by the
 * second line has not said it — which makes this the fastest way to find out
 * whether a subject line is carrying its own weight.
 */
export function WatchNotif({ n, channel, merged, surface }) {
  const cut = surface?.cut || {}
  return (
    <div className={styles.watchWrap}>
      <div className={styles.watch}>
        <span className={styles.crown} aria-hidden="true" />
        <span className={styles.sideBtn} aria-hidden="true" />
        <div className={styles.watchScreen}>
          <div className={styles.watchHead}>
            <ChannelMark channel={channel} size={15} radius={4} />
            <span>{n.app}</span>
            <i>9:41</i>
          </div>
          <div className={styles.watchTitle}>
            <Markup text={n.subtitle || n.title} merged={merged} cut={cut.title} showCut={false} />
          </div>
          <div className={styles.watchBody}>
            <Markup text={n.body} merged={merged} cut={cut.body} showCut={false} />
          </div>
          <div className={styles.watchBtn}>Dismiss</div>
        </div>
      </div>
      <span className={styles.watchBand} aria-hidden="true" />
      <span className={styles.watchBandTop} aria-hidden="true" />
    </div>
  )
}
