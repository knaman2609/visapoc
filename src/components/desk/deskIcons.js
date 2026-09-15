import { Mail, MessageCircle, Phone, Smartphone, Ticket } from 'lucide-react'

/**
 * A desk drawn as the channel it listens on, for the folded desk rail, where
 * there is no room for its name.
 */
export const DESK_ICON = {
  all: Ticket,
  'card-support': Mail,
  'in-app-help': Smartphone,
  'whatsapp-care': MessageCircle,
  'callback-requests': Phone,
}
