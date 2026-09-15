import { findSurface } from '../../data/surfaces.js'
import { notifModel } from './surfaces/model.js'
import { AppleMail, GmailApp, GmailOpen, GmailWeb } from './surfaces/MailSurfaces.jsx'
import {
  AndroidShade, IosBanner, IosCenter, IosLock, WatchNotif,
} from './surfaces/NotifSurfaces.jsx'
import { SmsList, SmsThread, WaChat, WaList, WaWeb } from './surfaces/ChatSurfaces.jsx'

/**
 * The artefact, on whichever surface it is being judged.
 *
 * This is a router and nothing else: every client is its own component with
 * its own vocabulary, because the moment they share a "generic phone preview"
 * they stop being previews. The email surfaces get the block stack and can
 * select into it; the notification surfaces get three strings and the
 * truncation rule of the client drawing them.
 */
export default function ChannelPreview({
  channel, tpl, fields, merged, view = 'lock', brand, dark, selected, onSelect,
}) {
  const surface = findSurface(view)
  const shared = { tpl, fields, merged, brand, dark, surface, selected, onSelect }

  switch (view) {
    case 'gmail-app': return <GmailApp {...shared} />
    case 'gmail-open': return <GmailOpen {...shared} />
    case 'gmail-web': return <GmailWeb {...shared} />
    case 'apple-mail': return <AppleMail {...shared} />
    case 'wa-chat': return <WaChat {...shared} />
    case 'wa-list': return <WaList {...shared} />
    case 'wa-web': return <WaWeb {...shared} />
    case 'sms-thread': return <SmsThread {...shared} />
    case 'sms-list': return <SmsList {...shared} />
    default: break
  }

  // The notification surfaces all read the same three strings.
  const n = notifModel(channel, tpl, fields, merged, brand)
  const notif = { n, channel, merged, surface, dark }
  switch (view) {
    case 'banner': return <IosBanner {...notif} />
    case 'center': return <IosCenter {...notif} />
    case 'android': return <AndroidShade {...notif} />
    case 'watch': return <WatchNotif {...notif} />
    default: return <IosLock {...notif} />
  }
}
