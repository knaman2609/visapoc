import {
  Camera, ChevronRight, Mic, MoreVertical, Paperclip, Phone, Plus,
  Search, SquarePen, Video, ArrowUp, ExternalLink, CornerUpLeft,
} from 'lucide-react'
import PhoneShell from '../../ui/PhoneShell.jsx'
import LaptopShell from '../../ui/LaptopShell.jsx'
import Markup from './Markup.jsx'
import { GenericMark } from './AppIcons.jsx'
import { SMS_THREADS, WA_CHATS, initial, waEmpty } from './model.js'
import { render } from '../../../data/templates.js'
import { smsParts } from '../../../data/copyLint.js'
import styles from './ChatSurfaces.module.css'

const cx = (...c) => c.filter(Boolean).join(' ')

/**
 * A WhatsApp business template, drawn the way WhatsApp draws one.
 *
 * A template is not free text: an optional header in bold, the body, an
 * optional footer in the secondary grey, and then up to two call-to-action
 * buttons or three quick replies as full-width rows hung off the bottom of
 * the bubble behind a hairline. Modelling those parts separately is what
 * makes the preview worth trusting — and what makes the template checks
 * possible at all.
 */
function WaBubble({ tpl, fields, merged, wide }) {
  const show = (t) => (merged ? render(t ?? '', fields) : (t ?? ''))
  const buttons = tpl.buttons || []

  return (
    <div className={cx(styles.waBubble, wide && styles.waBubbleWide)}>
      <span className={styles.waTail} aria-hidden="true" />
      <div className={styles.waInner}>
        {tpl.header ? (
          <div className={styles.waHeader}><Markup text={show(tpl.header)} merged={merged} tone="wa" /></div>
        ) : null}
        <div className={styles.waBody}><Markup text={show(tpl.body)} merged={merged} tone="wa" /></div>
        {tpl.footer ? (
          <div className={styles.waFooter}><Markup text={show(tpl.footer)} merged={merged} tone="wa" /></div>
        ) : null}
        <span className={styles.waMeta}>09:00</span>
      </div>

      {buttons.length ? (
        <div className={styles.waButtons}>
          {buttons.map((b, i) => (
            <span key={i} className={styles.waButton}>
              {b.kind === 'url' ? <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                : b.kind === 'call' ? <Phone size={14} strokeWidth={2} aria-hidden="true" />
                  : <CornerUpLeft size={14} strokeWidth={2} aria-hidden="true" />}
              <Markup text={show(b.label)} merged={merged} tone="wa" />
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** WhatsApp on a handset — the doodle wallpaper and the business chrome. */
export function WaChat({ tpl, fields, merged, brand, dark }) {
  return (
    <PhoneShell size="lg" chrome="ios" tone={dark ? 'light' : 'dark'} time="9:41"
      screenBg={dark ? '#0b141a' : '#f7f7f7'}>
      <div className={cx(styles.wa, dark && styles.waDark)}>
        <div className={styles.waBar}>
          <span className={styles.waBack}>
            <ChevronRight size={19} strokeWidth={2.6} style={{ transform: 'rotate(180deg)' }} aria-hidden="true" />
            <i>4</i>
          </span>
          <span className={styles.waAvatar}>{initial(brand?.sender || 'Visa Cards')}</span>
          <span className={styles.waWho}>
            <b>{brand?.sender || 'Visa Cards'}</b>
            <i>Business account</i>
          </span>
          <span className={styles.waBarRight}>
            <Video size={19} strokeWidth={1.8} aria-hidden="true" />
            <Phone size={17} strokeWidth={1.9} aria-hidden="true" />
          </span>
        </div>

        <div className={styles.waCanvas}>
          <div className={styles.waPaper} aria-hidden="true" />
          <span className={styles.waSystem}>
            This business works with other companies to manage this chat.
            <b> Tap to learn more</b>
          </span>
          {waEmpty(tpl) ? null : (
            <>
              <span className={styles.waDay}>TODAY</span>
              <WaBubble tpl={tpl} fields={fields} merged={merged} />
            </>
          )}
        </div>

        <div className={styles.waInput}>
          <Plus size={22} strokeWidth={1.8} className={styles.waPlus} aria-hidden="true" />
          <span className={styles.waField}>Message</span>
          <Camera size={19} strokeWidth={1.8} aria-hidden="true" />
          <Mic size={19} strokeWidth={1.8} aria-hidden="true" />
        </div>
      </div>
    </PhoneShell>
  )
}

/** The chat list — where the template competes with people they know. */
export function WaList({ tpl, fields, merged, brand, surface }) {
  const show = (t) => (merged ? render(t ?? '', fields) : (t ?? ''))
  const preview = [show(tpl.header), show(tpl.body)].filter(Boolean).join(': ')

  return (
    <PhoneShell size="lg" chrome="ios" time="9:41" screenBg="#fff">
      <div className={styles.waList}>
        <div className={styles.waListTop}>
          <span className={styles.waListEdit}>Edit</span>
          <span className={styles.waListTitle}>Chats</span>
          <SquarePen size={19} strokeWidth={1.8} className={styles.waListNew} aria-hidden="true" />
        </div>
        <div className={styles.waSearch}>
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <span>Search</span>
        </div>

        <div className={cx(styles.waRow, styles.waRowOurs)}>
          <span className={styles.waRowAvatar} style={{ background: '#1434cb' }}>
            {initial(brand?.sender || 'Visa Cards')}
          </span>
          <span className={styles.waRowMain}>
            <span className={styles.waRowTop}>
              <b>{brand?.sender || 'Visa Cards'}</b>
              <i className={styles.waRowNow}>09:00</i>
            </span>
            <span className={cx(styles.waRowLast, !preview.trim() && styles.waRowIdle)}>
              {preview.trim()
                ? <Markup text={preview} merged={merged} cut={surface?.cut?.body} showCut={false} />
                : 'No message yet'}
            </span>
          </span>
          <span className={styles.waBadge}>1</span>
        </div>

        {WA_CHATS.map((c) => (
          <div key={c.name} className={styles.waRow}>
            <span className={styles.waRowAvatar} style={{ background: c.hue }}>{initial(c.name)}</span>
            <span className={styles.waRowMain}>
              <span className={styles.waRowTop}><b>{c.name}</b><i>{c.when}</i></span>
              <span className={styles.waRowLast}>{c.last}</span>
            </span>
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}

/** WhatsApp Web — the desktop client, same template, more room. */
export function WaWeb({ tpl, fields, merged, brand }) {
  const show = (t) => (merged ? render(t ?? '', fields) : (t ?? ''))
  return (
    <LaptopShell title="web.whatsapp.com" size="lg">
      <div className={styles.web}>
        <div className={styles.webSide}>
          <div className={styles.webSideTop}>
            <span className={styles.waRowAvatar} style={{ background: '#7f8c8d' }}>R</span>
            <span className={styles.webSideTools}>
              <SquarePen size={17} strokeWidth={1.8} aria-hidden="true" />
              <MoreVertical size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </div>
          <div className={styles.webSearch}>
            <Search size={14} strokeWidth={2} aria-hidden="true" />
            <span>Search or start a new chat</span>
          </div>
          <div className={cx(styles.webRow, styles.webRowOn)}>
            <span className={styles.waRowAvatar} style={{ background: '#1434cb' }}>
              {initial(brand?.sender || 'Visa Cards')}
            </span>
            <span className={styles.waRowMain}>
              <span className={styles.waRowTop}>
                <b>{brand?.sender || 'Visa Cards'}</b><i>09:00</i>
              </span>
              <span className={styles.waRowLast}>{show(tpl.header) || show(tpl.body)}</span>
            </span>
          </div>
          {WA_CHATS.map((c) => (
            <div key={c.name} className={styles.webRow}>
              <span className={styles.waRowAvatar} style={{ background: c.hue }}>{initial(c.name)}</span>
              <span className={styles.waRowMain}>
                <span className={styles.waRowTop}><b>{c.name}</b><i>{c.when}</i></span>
                <span className={styles.waRowLast}>{c.last}</span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.webMain}>
          <div className={styles.webChatBar}>
            <span className={styles.waRowAvatar} style={{ background: '#1434cb' }}>
              {initial(brand?.sender || 'Visa Cards')}
            </span>
            <span className={styles.waWho}>
              <b>{brand?.sender || 'Visa Cards'}</b>
              <i>Business account</i>
            </span>
            <span className={styles.webSideTools}>
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              <MoreVertical size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </div>
          <div className={styles.webCanvas}>
            <div className={styles.waPaper} aria-hidden="true" />
            {waEmpty(tpl) ? null : (
              <>
                <span className={styles.waDay}>TODAY</span>
                <WaBubble tpl={tpl} fields={fields} merged={merged} wide />
              </>
            )}
          </div>
          <div className={styles.webInput}>
            <Plus size={20} strokeWidth={1.8} aria-hidden="true" />
            <Paperclip size={19} strokeWidth={1.8} aria-hidden="true" />
            <span className={styles.webField}>Type a message</span>
            <Mic size={19} strokeWidth={1.8} aria-hidden="true" />
          </div>
        </div>
      </div>
    </LaptopShell>
  )
}

/**
 * A shortcode thread in Messages.
 *
 * SMS is the one channel where a character is a line item, so the bubble
 * carries the segment boundary: once merged, the studio marks where the first
 * 160 units run out and everything after it starts billing twice.
 */
export function SmsThread({ tpl, fields, merged, dark }) {
  const text = merged ? render(tpl.body || '', fields) : (tpl.body || '')
  const parts = merged ? smsParts(text) : null
  const boundary = parts && parts.parts > 1 ? parts.perPart : 0

  return (
    <PhoneShell size="lg" chrome="ios" tone={dark ? 'light' : 'dark'} time="9:41"
      screenBg={dark ? '#000' : '#fff'}>
      <div className={cx(styles.ios, dark && styles.iosDark)}>
        <div className={styles.iosNav}>
          <span className={styles.iosBack}>
            <ChevronRight size={19} strokeWidth={2.6} style={{ transform: 'rotate(180deg)' }} aria-hidden="true" />
            <i>12</i>
          </span>
          <span className={styles.iosWho}>
            <span className={styles.iosAvatar}>VI</span>
            <b>VM-VISAIN <ChevronRight size={9} strokeWidth={3} aria-hidden="true" /></b>
          </span>
          <span className={styles.iosNavRight} aria-hidden="true" />
        </div>

        <div className={styles.iosThread}>
          {!text.trim() ? null : (
          <>
          <div className={styles.stamp}>
            <b>Text Message</b> · SMS
            <span>Today 9:00 AM</span>
          </div>
          <div className={styles.smsRow}>
            <div className={styles.smsBubble}>
              {boundary ? (
                <>
                  <Markup text={text.slice(0, boundary)} merged={merged} />
                  <span className={styles.segMark} title={`Segment 2 starts here — this send bills ${parts.parts}×`}>
                    <i>{parts.parts}×</i>
                  </span>
                  <Markup text={text.slice(boundary)} merged={merged} />
                </>
              ) : (
                <Markup text={text} merged={merged} />
              )}
            </div>
          </div>
          {parts ? (
            <span className={styles.smsMeta}>
              {parts.parts} segment{parts.parts > 1 ? 's' : ''} · {parts.units}/{parts.capacity} · {parts.encoding}
            </span>
          ) : null}
          </>
          )}
        </div>

        <div className={styles.iosInput}>
          <Plus size={22} strokeWidth={1.8} className={styles.iosPlus} aria-hidden="true" />
          <span className={styles.iosField}>
            Text Message
            <ArrowUp size={13} strokeWidth={3} className={styles.iosSend} aria-hidden="true" />
          </span>
        </div>
      </div>
    </PhoneShell>
  )
}

/** The Messages list — two lines beside every OTP they got today. */
export function SmsList({ tpl, fields, merged, surface }) {
  const text = merged ? render(tpl.body || '', fields) : (tpl.body || '')
  return (
    <PhoneShell size="lg" chrome="ios" time="9:41" screenBg="#fff">
      <div className={styles.ios}>
        <div className={styles.listTop}>
          <span className={styles.listEdit}>Edit</span>
          <SquarePen size={19} strokeWidth={1.8} className={styles.listNew} aria-hidden="true" />
        </div>
        <h1 className={styles.listTitle}>Messages</h1>
        <div className={styles.listSearch}>
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <span>Search</span>
        </div>

        <div className={cx(styles.listRow, styles.listOurs)}>
          <span className={styles.listDot} aria-hidden="true" />
          <span className={styles.listAvatar}>VI</span>
          <span className={styles.listMain}>
            <span className={styles.listTop2}><b>VM-VISAIN</b><i>9:00 AM</i></span>
            <span className={cx(styles.listLast, !text.trim() && styles.listIdle)}>
              {text.trim()
                ? <Markup text={text} merged={merged} cut={surface?.cut?.body} showCut={false} />
                : 'No message yet'}
            </span>
          </span>
          <ChevronRight size={13} strokeWidth={2.4} className={styles.listChev} aria-hidden="true" />
        </div>

        {SMS_THREADS.map((t) => (
          <div key={t.name} className={styles.listRow}>
            <span className={styles.listAvatar}>{t.name.slice(3, 5) || initial(t.name)}</span>
            <span className={styles.listMain}>
              <span className={styles.listTop2}><b>{t.name}</b><i>{t.when}</i></span>
              <span className={styles.listLast}>{t.last}</span>
            </span>
            <ChevronRight size={13} strokeWidth={2.4} className={styles.listChev} aria-hidden="true" />
          </div>
        ))}
      </div>
    </PhoneShell>
  )
}

export { GenericMark }
