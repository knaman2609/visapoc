import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChartLine, ChartNoAxesCombined, ChevronRight, ClipboardCheck, FileText, Headset, Inbox, KeyRound,
  Megaphone, MessagesSquare, PenLine, ScrollText, Settings, ShieldCheck, Sparkles,
  Stamp, Target, TrendingUp, UserCheck, UsersRound, Workflow,
} from 'lucide-react'
import VisaLogo from './VisaLogo.jsx'
import styles from './Sidebar.module.css'
import { useIdentity, usePmPage, useRmPage, useRole } from './useLayoutInfo.js'
import { WORKFLOWS } from '../../data/workflows.js'

export default function Sidebar() {
  const role = useRole()
  const page = usePmPage()
  const rmPage = useRmPage()
  const navigate = useNavigate()
  const { search, pathname } = useLocation()
  const { userName, userRole } = useIdentity()
  // An item with children opens on its own; being on one of them opens it too,
  // so the sidebar always shows where you are.
  const [opened, setOpened] = useState({})

  const groups = buildGroups(role, page, rmPage, navigate, new URLSearchParams(search), pathname)

  return (
    <nav className={styles.side} aria-label="Console sections">
      <div className={styles.brand}>
        <VisaLogo className={styles.logo} />
        <div className={styles.name}>Agentic Intelligence</div>
      </div>

      <div className={styles.groups}>
        {groups.map((g) => (
          <div key={g.label} className={styles.group}>
            <div className={styles.label}>{g.label}</div>
            {g.items.map((it) => {
              const open = it.children ? (opened[it.label] ?? it.on) : false
              return (
                <div key={it.label}>
                  <button
                    type="button"
                    className={`${styles.item} ${it.on && !it.children ? styles.active : ''} ${
                      it.on && it.children ? styles.parentOn : ''}`}
                    onClick={it.children
                      ? () => { setOpened((p) => ({ ...p, [it.label]: !open })); it.go?.() }
                      : it.go}
                    disabled={it.on && !it.children}
                    aria-expanded={it.children ? open : undefined}
                  >
                    <it.icon className={styles.icon} size={16} strokeWidth={1.75} aria-hidden="true" />
                    <div className={styles.text}>{it.label}</div>
                    {it.dot ? <div className={styles.notify} /> : null}
                    {it.children && (
                      <ChevronRight
                        className={`${styles.chev} ${open ? styles.chevOpen : ''}`}
                        size={13} strokeWidth={2} aria-hidden="true"
                      />
                    )}
                  </button>

                  {it.children && open && (
                    <div className={styles.children}>
                      {it.children.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          className={`${styles.child} ${c.on ? styles.childOn : ''}`}
                          onClick={c.go}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className={styles.user}>
        <div className={styles.userName}>{userName}</div>
        <div className={styles.userRole}>{userRole}</div>
      </div>
    </nav>
  )
}

function buildGroups(role, page, rmPage, navigate, params, pathname) {
  if (role === 'pm') {
    return [
      { label: 'Overview', items: [
        { label: 'Assistant', icon: Sparkles, on: page === 'assistant', dot: true, go: () => navigate('/pm/assistant') },
        { label: 'Opportunities', icon: Target, on: page === 'flow', go: () => navigate('/pm/flow/0') },
      ] },
      // Onboarding leads: it is the stretch before anything else in this
      // console applies, so it reads first rather than after the growth work.
      { label: 'Onboarding', items: [
        {
          label: 'Application breakdown',
          icon: ChartLine,
          on: page === 'analytics' && params.get('tab') === 'breakdown',
          go: () => navigate('/pm/analytics?tab=breakdown'),
        },
        {
          label: 'Priority queue',
          icon: Inbox,
          on: page === 'analytics' && params.get('tab') === 'queue',
          go: () => navigate('/pm/analytics?tab=queue'),
        },
      ] },
      { label: 'Growth', items: [
        { label: 'Deep dive', icon: ChartNoAxesCombined, on: page === 'deepdive', go: () => navigate('/pm/deep-dive') },
        {
          label: 'Campaign studio',
          icon: PenLine,
          on: page === 'studio',
          go: () => navigate('/pm/studio'),
          children: [
            {
              label: 'Saved designs',
              on: pathname === '/pm/studio/designs',
              go: () => navigate('/pm/studio/designs'),
            },
            {
              label: 'New design',
              on: pathname === '/pm/studio/new',
              go: () => navigate('/pm/studio/new'),
            },
          ],
        },
        {
          label: 'Campaigns',
          icon: Megaphone,
          on: page === 'campaigns',
          go: () => navigate('/pm/campaigns'),
          children: [
            {
              label: 'Analytics',
              on: page === 'campaigns' && params.get('view') !== 'register',
              go: () => navigate('/pm/campaigns'),
            },
            {
              label: 'Live register',
              on: page === 'campaigns' && params.get('view') === 'register',
              go: () => navigate('/pm/campaigns?view=register'),
            },
          ],
        },
        {
          label: 'Workflows',
          icon: Workflow,
          on: page === 'workflows',
          go: () => navigate('/pm/workflows'),
          children: WORKFLOWS.map((w) => ({
            label: w.label,
            on: pathname === `/pm/workflows/${w.id}`,
            go: () => navigate(`/pm/workflows/${w.id}`),
          })),
        },
        { label: 'Audiences', icon: UserCheck },
      ] },
      // Support is the desk's side of what people write in about. It gets a
      // group of its own rather than a line under Onboarding: most tickets are
      // about onboarding, but the rest are from cardholders the funnel has
      // already let go of. Its desks, folders and labels live in the Xyne Desk
      // rail on the page itself, so the item has no children here.
      { label: 'Service', items: [
        { label: 'Support', icon: Headset, on: page === 'support', go: () => navigate('/pm/support') },
      ] },
      // Team management is part of this console rather than one of its own, so
      // it sits in the PM sidebar between Onboarding and Controls. The group
      // keeps the front door's name: somebody arrives by clicking "Team
      // management" there, and a group called anything else reads as a
      // different feature.
      { label: 'Team management', items: [
        { label: 'Users', icon: UsersRound, on: page === 'users', go: () => navigate('/pm/users') },
        { label: 'Roles', icon: KeyRound, on: page === 'roles', go: () => navigate('/pm/roles') },
        { label: 'Audit log', icon: ScrollText },
      ] },
      { label: 'Controls', items: [
        { label: 'Policies', icon: ShieldCheck, on: false, dot: true },
        { label: 'Approvals', icon: Stamp }, { label: 'Settings', icon: Settings },
      ] },
    ]
  }
  // RM
  return [
    { label: 'Overview', items: [
      { label: 'Assistant', icon: Sparkles, on: false, dot: true },
    ] },
    // "My performance" is this RM's own book — conversion and response across
    // the customers they work — not the onboarding funnel. It keeps the name
    // the header gives it; only its position moved.
    { label: 'Insights', items: [
      { label: 'My performance', icon: TrendingUp, on: rmPage === 'analytics', go: () => navigate('/rm/analytics') },
      { label: 'Reports', icon: FileText },
    ] },
    { label: 'My book', items: [
      { label: 'Customer queue', icon: Inbox, on: rmPage === 'queue', go: () => navigate('/customers') },
      { label: 'Assigned actions', icon: ClipboardCheck },
      { label: 'Conversations', icon: MessagesSquare },
    ] },
    { label: 'Controls', items: [
      { label: 'Policies', icon: ShieldCheck }, { label: 'Settings', icon: Settings },
    ] },
  ]
}
