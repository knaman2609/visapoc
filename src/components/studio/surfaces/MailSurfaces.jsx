import {
  Archive, ArrowLeft, ChevronDown, ChevronRight, CornerUpLeft, Forward,
  Inbox, LayoutGrid, Menu, MoreVertical, Pencil, Reply, Search, Send,
  Settings, SlidersHorizontal, Star, Tag, Trash2, Users, Video,
} from 'lucide-react'
import PhoneShell from '../../ui/PhoneShell.jsx'
import LaptopShell from '../../ui/LaptopShell.jsx'
import EmailCanvas from '../EmailCanvas.jsx'
import Markup from './Markup.jsx'
import { GmailMark } from './AppIcons.jsx'
import { GMAIL_ROWS, initial, senderAddress, subjectOr } from './model.js'
import { render } from '../../../data/templates.js'
import styles from './MailSurfaces.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')

/** One row of somebody else's promotional email, drawn the way Gmail draws it. */
function Row({ r, dark }) {
  return (
    <div className={cx(styles.gRow, r.unread && styles.gUnread, dark && styles.gRowDark)}>
      <span className={styles.gAvatar} style={{ background: r.hue }}>{initial(r.from)}</span>
      <span className={styles.gMain}>
        <span className={styles.gTop}>
          <b>{r.from}</b>
          <i>{r.when}</i>
        </span>
        <span className={styles.gSubject}>{r.subject}</span>
        <span className={styles.gSnippet}>{r.snippet}</span>
      </span>
      <Star size={16} strokeWidth={1.6} className={styles.gStar} aria-hidden="true" />
    </div>
  )
}

/**
 * Gmail for iOS, inbox.
 *
 * The most consequential surface an email has, and the one almost never
 * checked: three lines of a row, in a list of eleven other things that
 * arrived the same morning, with the promotions tab already deciding how much
 * attention any of them gets. The preheader is the third line — copy nobody
 * writes and Gmail always shows.
 */
export function GmailApp({ tpl, fields, merged, brand, dark, surface }) {
  const cut = surface?.cut || {}
  const subject = subjectOr(
    merged ? render(tpl.subject || '', fields) : (tpl.subject || ''), 'gmail',
  )
  const pre = merged ? render(tpl.preheader || '', fields) : (tpl.preheader || '')

  return (
    <PhoneShell size="lg" chrome="ios" tone={dark ? 'light' : 'dark'} time="9:41"
      screenBg={dark ? '#1f1f1f' : '#fff'}>
      <div className={cx(styles.gApp, dark && styles.gDark)}>
        <div className={styles.gSearch}>
          <Menu size={19} strokeWidth={1.8} aria-hidden="true" />
          <span className={styles.gSearchText}>Search in mail</span>
          <span className={styles.gMe}>R</span>
        </div>

        <div className={styles.gTabs} role="tablist">
          <span className={styles.gTab}><Inbox size={15} strokeWidth={1.8} aria-hidden="true" />Primary</span>
          <span className={cx(styles.gTab, styles.gTabOn)}>
            <Tag size={15} strokeWidth={1.8} aria-hidden="true" />Promotions
          </span>
          <span className={styles.gTab}><Users size={15} strokeWidth={1.8} aria-hidden="true" />Social</span>
        </div>

        <div className={styles.gList}>
          <div className={cx(styles.gRow, styles.gUnread, styles.gOurs, dark && styles.gRowDark)}>
            <span className={styles.gAvatar} style={{ background: '#1434cb' }}>
              {initial(brand?.sender || 'Visa Cards')}
            </span>
            <span className={styles.gMain}>
              <span className={styles.gTop}>
                <b>{brand?.sender || 'Visa Cards'}</b>
                <i className={styles.gNow}>09:00</i>
              </span>
              <span className={styles.gSubject}>
                <Markup text={subject} merged={merged} cut={cut.title} tone="gmail" />
              </span>
              <span className={styles.gSnippet}>
                {pre
                  ? <Markup text={pre} merged={merged} cut={cut.body} tone="gmail" />
                  : <em className={styles.gNoPre}>No preheader — Gmail falls back to the first line of the email</em>}
              </span>
            </span>
            <Star size={16} strokeWidth={1.6} className={styles.gStar} aria-hidden="true" />
          </div>

          {GMAIL_ROWS.map((r) => <Row key={r.from} r={r} dark={dark} />)}
        </div>

        <div className={styles.gFab}>
          <Pencil size={17} strokeWidth={1.9} aria-hidden="true" />
          <span>Compose</span>
        </div>

        <div className={styles.gNav}>
          {[['Mail', true], ['Meet', false]].map(([label, on]) => (
            <span key={label} className={cx(styles.gNavItem, on && styles.gNavOn)}>
              <span className={styles.gNavPill}>
                {label === 'Mail'
                  ? <Inbox size={17} strokeWidth={1.9} aria-hidden="true" />
                  : <Video size={17} strokeWidth={1.9} aria-hidden="true" />}
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </PhoneShell>
  )
}

/** Gmail for iOS with the message open — the client's chrome around the art. */
export function GmailOpen({ tpl, fields, merged, brand, dark, selected, onSelect }) {
  return (
    <PhoneShell size="lg" chrome="ios" tone={dark ? 'light' : 'dark'} time="9:41"
      screenBg={dark ? '#1f1f1f' : '#fff'}>
      <div className={cx(styles.gApp, dark && styles.gDark)}>
        <div className={styles.gOpenBar}>
          <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
          <span className={styles.gOpenTools}>
            <Archive size={19} strokeWidth={1.8} aria-hidden="true" />
            <Trash2 size={19} strokeWidth={1.8} aria-hidden="true" />
            <MoreVertical size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </div>

        <div className={styles.gOpenScroll}>
          <div className={styles.gOpenHead}>
            <h1 className={styles.gOpenSubject}>
              <Markup
                text={subjectOr(merged ? render(tpl.subject || '', fields) : tpl.subject, 'gmail')}
                merged={merged}
                tone="gmail"
              />
            </h1>
            <span className={styles.gLabel}><Tag size={11} strokeWidth={2} aria-hidden="true" />Promotions</span>
          </div>

          <div className={styles.gFrom}>
            <span className={styles.gAvatar} style={{ background: '#1434cb' }}>
              {initial(brand?.sender || 'Visa Cards')}
            </span>
            <span className={styles.gFromText}>
              <b>{brand?.sender || 'Visa Cards'}</b>
              <i>to me <ChevronDown size={11} strokeWidth={2} aria-hidden="true" /></i>
            </span>
            <span className={styles.gFromRight}>
              09:00
              <Reply size={16} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </div>

          <div className={styles.gBody}>
            <EmailCanvas
              blocks={tpl.blocks || []} fields={fields} merged={merged} compact
              dark={dark} brand={brand} selected={selected} onSelect={onSelect} flat
            />
          </div>

          <div className={styles.gReplies}>
            {[['Reply', CornerUpLeft], ['Reply all', Reply], ['Forward', Forward]].map(([label, Icon]) => (
              <span key={label} className={styles.gReply}>
                <Icon size={14} strokeWidth={1.8} aria-hidden="true" />{label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </PhoneShell>
  )
}

/**
 * Gmail on a desktop, reading pane below the inbox.
 *
 * The list runs the full width here, which is the whole point: a subject gets
 * about 74 characters before Gmail stops drawing it, against 33 on the phone,
 * and a line written for one of those is wrong on the other. Putting the open
 * message under the list keeps both truncation points on screen at once.
 */
export function GmailWeb({ tpl, fields, merged, brand, dark, surface, selected, onSelect }) {
  const cut = surface?.cut || {}
  const subject = subjectOr(
    merged ? render(tpl.subject || '', fields) : (tpl.subject || ''), 'gmail',
  )
  const pre = merged ? render(tpl.preheader || '', fields) : (tpl.preheader || '')

  return (
    <LaptopShell title="mail.google.com" size="lg">
      <div className={cx(styles.web, dark && styles.webDark)}>
        <header className={styles.webBar}>
          <Menu size={18} strokeWidth={1.7} className={styles.webIcon} aria-hidden="true" />
          <span className={styles.webLogo}>
            <GmailMark size={22} radius={0} />
            <b>Gmail</b>
          </span>
          <span className={styles.webSearch}>
            <Search size={16} strokeWidth={1.8} aria-hidden="true" />
            <i>Search mail</i>
            <SlidersHorizontal size={15} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className={styles.webBarRight}>
            <Settings size={17} strokeWidth={1.7} aria-hidden="true" />
            <LayoutGrid size={17} strokeWidth={1.7} aria-hidden="true" />
            <span className={styles.gMe}>R</span>
          </span>
        </header>

        <div className={styles.webBody}>
          <nav className={styles.webRail}>
            <span className={styles.webCompose}>
              <Pencil size={16} strokeWidth={1.9} aria-hidden="true" />Compose
            </span>
            {[
              ['Inbox', Inbox, 42, true], ['Starred', Star, 0, false],
              ['Sent', Send, 0, false], ['Drafts', Pencil, 3, false],
            ].map(([label, Icon, n, on]) => (
              <span key={label} className={cx(styles.webNav, on && styles.webNavOn)}>
                <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                {label}
                {n ? <i>{n}</i> : null}
              </span>
            ))}
          </nav>

          <div className={styles.webMain}>
          <div className={styles.webList}>
            <div className={styles.webTabs}>
              <span className={styles.webTab}><Inbox size={14} strokeWidth={1.8} aria-hidden="true" />Primary</span>
              <span className={cx(styles.webTab, styles.webTabOn)}>
                <Tag size={14} strokeWidth={1.8} aria-hidden="true" />Promotions
              </span>
            </div>
            <div className={cx(styles.webRow, styles.webRowOn)}>
              <Star size={14} strokeWidth={1.6} className={styles.webStar} aria-hidden="true" />
              <b>{brand?.sender || 'Visa Cards'}</b>
              <span className={styles.webSubject}>
                <Markup text={subject} merged={merged} cut={cut.title} tone="gmail" showCut={false} />
                {pre ? <i> — <Markup text={pre} merged={merged} tone="gmail" /></i> : null}
              </span>
              <em>09:00</em>
            </div>
            {GMAIL_ROWS.slice(0, 4).map((r) => (
              <div key={r.from} className={cx(styles.webRow, !r.unread && styles.webRead)}>
                <Star size={14} strokeWidth={1.6} className={styles.webStar} aria-hidden="true" />
                <b>{r.from}</b>
                <span className={styles.webSubject}>{r.subject}<i> — {r.snippet}</i></span>
                <em>{r.when}</em>
              </div>
            ))}
          </div>

          <div className={styles.webPane}>
            <div className={styles.webPaneHead}>
              <h1>
                <Markup text={subject} merged={merged} tone="gmail" />
              </h1>
              <span className={styles.gLabel}><Tag size={11} strokeWidth={2} aria-hidden="true" />Promotions</span>
            </div>
            <div className={styles.webPaneFrom}>
              <span className={styles.gAvatar} style={{ background: '#1434cb' }}>
                {initial(brand?.sender || 'Visa Cards')}
              </span>
              <span className={styles.webFromText}>
                <b>{brand?.sender || 'Visa Cards'}</b>
                <i>&lt;{senderAddress(brand)}&gt;</i>
              </span>
              <em>09:00 (0 minutes ago)</em>
            </div>
            <div className={styles.webPaneBody}>
              <EmailCanvas
                blocks={tpl.blocks || []} fields={fields} merged={merged}
                dark={dark} brand={brand} selected={selected} onSelect={onSelect}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
    </LaptopShell>
  )
}

/**
 * Apple Mail on a handset.
 *
 * No promotions tab, no image blocking and no dark-mode rewrite of the body —
 * the friendliest client in the set, and the one that flatters a design most.
 * Worth having on screen precisely so it is not the only one looked at.
 */
export function AppleMail({ tpl, fields, merged, brand, selected, onSelect }) {
  return (
    <PhoneShell size="lg" chrome="ios" time="9:41" screenBg="#fff">
      <div className={styles.am}>
        <div className={styles.amNav}>
          <span className={styles.amBack}>
            <ChevronRight size={17} strokeWidth={2.4} style={{ transform: 'rotate(180deg)' }} aria-hidden="true" />
            Inbox
          </span>
          <span className={styles.amNavRight}>
            <ChevronDown size={17} strokeWidth={2} style={{ transform: 'rotate(180deg)' }} aria-hidden="true" />
            <ChevronDown size={17} strokeWidth={2} aria-hidden="true" />
          </span>
        </div>

        <div className={styles.amScroll}>
          <div className={styles.amFrom}>
            <span className={styles.amAvatar}>{initial(brand?.sender || 'Visa Cards')}</span>
            <span className={styles.amFromText}>
              <b>{brand?.sender || 'Visa Cards'}</b>
              <i>To: {fields.first_name} <ChevronRight size={10} strokeWidth={2.6} aria-hidden="true" /></i>
            </span>
            <em>Today at 09:00</em>
          </div>
          <h1 className={styles.amSubject}>
            <Markup
              text={subjectOr(merged ? render(tpl.subject || '', fields) : tpl.subject, 'apple')}
              merged={merged}
            />
          </h1>
          <div className={styles.amBody}>
            <EmailCanvas
              blocks={tpl.blocks || []} fields={fields} merged={merged} compact
              brand={brand} selected={selected} onSelect={onSelect} flat
            />
          </div>
        </div>

        <div className={styles.amBottom}>
          <Archive size={19} strokeWidth={1.7} aria-hidden="true" />
          <Trash2 size={19} strokeWidth={1.7} aria-hidden="true" />
          <CornerUpLeft size={19} strokeWidth={1.7} aria-hidden="true" />
          <Forward size={19} strokeWidth={1.7} aria-hidden="true" />
          <Pencil size={19} strokeWidth={1.7} aria-hidden="true" />
        </div>
      </div>
    </PhoneShell>
  )
}
