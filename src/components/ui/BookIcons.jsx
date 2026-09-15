import CardMark, { isCardProduct } from './CardMark.jsx'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowRightLeft, ArrowUp, ArrowUpRight,
  Briefcase, Building2, CircleUser, CreditCard, Crosshair, Fuel, Gem,
  Globe, IndianRupee, Landmark, Map, MonitorSmartphone, Moon, Mountain, Palmtree,
  Plane, Receipt, Ship, ShoppingBag, ShoppingCart, Sun, TrendingUp, Tv, UserCheck,
  UserMinus, UserPlus, UserRound, Users, UtensilsCrossed, Wallet,
} from 'lucide-react'

/**
 * One icon per measure and per cut of the book.
 *
 * Kept in one place so a metric wears the same mark wherever it appears — the
 * filter chip, the dropdown row, the column head — rather than being picked
 * again at each call site and drifting apart.
 *
 * Stroke is 1.75 throughout, matching the sidebar: one weight per icon set.
 */
const METRIC = {
  pv:        IndianRupee,    // ₹ Cr on the book
  cards:     Users,          // cardholders, i.e. people
  attrition: UserMinus,      // customers leaving
  spend:     Wallet,         // annual spend per card
  dormant:   Moon,           // cards asleep
  intl:      Globe,          // international share
  txns:      ArrowRightLeft, // transactions
  ticket:    Receipt,        // average ticket
  yoy:       TrendingUp,     // where the corridor is going
}

const DIMENSION = {
  card:     CreditCard,
  persona:  UserRound,
  zone:     Map,
  category: ShoppingBag,
  corridor: Globe,
}

export function MetricIcon({ id, size = 14, className }) {
  const Icon = METRIC[id]
  return Icon
    ? <Icon size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
    : null
}

export function DimensionIcon({ id, size = 15, className }) {
  const Icon = DIMENSION[id]
  return Icon
    ? <Icon size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
    : null
}

/**
 * One icon per member of the book, so the marks change with the cut rather
 * than repeating the dimension's own icon down every row — six identical
 * marks would say the same thing six times.
 *
 * Each cut gets its own language: card products read as tiers, personas as
 * who the person is, geography as a compass, categories as what was bought.
 * Only one cut is on screen at a time, so a mark reused between two of them
 * is never seen twice at once.
 */
const MEMBER = {
  /* Card products are not in here: a product has a face, so it renders as a
     miniature of the plastic in CardMark rather than as a glyph. */

  /* Personas — who is holding it */
  p1: Gem,               // HNI self-employed
  p2: Building2,         // Affluent salaried · metro
  p3: UserCheck,         // Senior professional · long tenure
  p4: UserPlus,          // Young professional · first premium card
  p5: CircleUser,        // Mass salaried
  p6: Briefcase,         // Business owner

  /* Geography — the column reads as a compass */
  z1: ArrowUp,           // North
  z2: ArrowUpRight,      // North-East
  z3: ArrowLeft,         // West
  z4: Crosshair,         // Central
  z5: ArrowRight,        // East
  z6: ArrowDown,         // South

  /* Spend categories — what was bought */
  c1: Plane,             // Travel
  c2: ShoppingCart,      // Retail & grocery
  c3: MonitorSmartphone, // Online & subscriptions
  c4: Tv,                // Electronics & large ticket
  c5: UtensilsCrossed,   // Dining
  c6: Fuel,              // Fuel & utilities

  /* International corridors — where the money lands */
  w1: Sun,               // Gulf
  w2: Building2,         // North America
  w3: Landmark,          // United Kingdom & Europe
  w4: Palmtree,          // South-East Asia
  w5: Ship,              // East Asia & Pacific
  w6: Mountain,          // South Asia
}

export function MemberIcon({ id, size = 15, className }) {
  // A card product wears its own face; every other cut takes a lucide mark.
  if (isCardProduct(id)) return <CardMark id={id} w={size + 3} />
  const Icon = MEMBER[id]
  return Icon
    ? <Icon size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
    : null
}
