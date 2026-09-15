/**
 * Console users, roles and permissions.
 *
 * This is the access side of the product rather than the customer side: who
 * can open which screen of this console, and who decided that. The console
 * itself is the only system of record here — there is no directory behind it,
 * so a permission is meaningful only if it maps to something the app can
 * actually do. Every id in PERMISSIONS names a real route or a real action in
 * this build; nothing is listed that the console cannot perform.
 *
 * Shape follows customers.js and onboarding.js: a handful of hand-written
 * people carrying the editorial detail, then a seeded expansion to a headcount
 * a bank of this size would really have. The seed is the user id, so the same
 * person always gets the same team, the same joining date and the same
 * activity trail across reloads.
 *
 * Nothing written through the UI lands here. Edits made on the screens are
 * held in React state for the session and are gone on reload — the screens say
 * so rather than implying a save.
 */

import { FIRST, LAST, METROS, between, hash, mulberry32, pick } from './population.js'

/* ── Permissions ────────────────────────────────────────────────────── */

/**
 * The grantable surface, grouped the way the sidebar groups it.
 *
 * `sensitive` marks the three that move money or grant access — assigning a
 * limit, launching to a live audience, and administering users. They are
 * called out in the matrix because those are the rows an auditor reads first.
 */
export const PERMISSION_GROUPS = [
  { id: 'lifecycle', label: 'Lifecycle view' },
  { id: 'portfolio', label: 'Portfolio view' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'admin', label: 'Administration' },
]

export const PERMISSIONS = [
  {
    id: 'rm.queue',
    group: 'lifecycle',
    label: 'Work the customer queue',
    line: 'Open the ranked queue and run the agent analysis on a customer.',
    surface: '/customers',
  },
  {
    id: 'rm.contact',
    group: 'lifecycle',
    label: 'Contact a customer',
    line: 'Approve the drafted message and send it to the cardholder.',
    surface: '/customers/:id',
  },
  {
    id: 'limits.assign',
    group: 'lifecycle',
    label: 'Assign a credit limit',
    line: 'Accept the recommended limit for an approved applicant.',
    surface: 'Limit recommendation',
    sensitive: true,
  },
  {
    id: 'rm.analytics',
    group: 'lifecycle',
    label: 'Read relationship performance',
    line: 'Conversion, response and value figures for a book.',
    surface: '/rm/analytics',
  },
  {
    id: 'pm.opportunities',
    group: 'portfolio',
    label: 'Work an opportunity',
    line: 'Take a detected opportunity through the seven-step flow.',
    surface: '/pm/flow/:step',
  },
  {
    id: 'pm.cohorts',
    group: 'portfolio',
    label: 'Build cohorts',
    line: 'Define and iterate the audience an opportunity targets.',
    surface: 'Cohort builder',
  },
  {
    id: 'pm.scans',
    group: 'portfolio',
    label: 'Read portfolio scans',
    line: 'The overnight scan register and what each scan found.',
    surface: '/pm/scans',
  },
  {
    id: 'pm.analytics',
    group: 'portfolio',
    label: 'Read portfolio analytics',
    line: 'Onboarding funnel, deep dive and the application book.',
    surface: '/pm/analytics, /pm/deep-dive',
  },
  {
    id: 'campaigns.design',
    group: 'campaigns',
    label: 'Design a campaign',
    line: 'Choose what each half of the cohort gets, the journey it runs, and whether the agent or a fixed sequence decides the sends.',
    surface: 'Flow steps 2–4',
  },
  {
    id: 'campaigns.approve',
    group: 'campaigns',
    label: 'Approve a campaign',
    line: 'Sign off the design, spend and audience before launch.',
    surface: 'Flow step 5',
  },
  {
    id: 'campaigns.launch',
    group: 'campaigns',
    label: 'Launch a campaign',
    line: 'Release an approved campaign to the live audience.',
    surface: 'Flow step 6, /pm/campaigns',
    sensitive: true,
  },
  {
    id: 'campaigns.correct',
    group: 'campaigns',
    label: 'Correct a live campaign',
    line: 'Change a campaign that is already running — the audience is being contacted while this decision is taken, so it is not the same call as approving one.',
    surface: 'Flow step 7',
    sensitive: true,
  },
  {
    id: 'admin.users',
    group: 'admin',
    label: 'Manage users and roles',
    line: 'Invite, suspend and re-role anyone in this console.',
    surface: '/pm/users',
    sensitive: true,
  },
]

export const PERMISSION_BY_ID = Object.fromEntries(PERMISSIONS.map((p) => [p.id, p]))

/* ── Roles ──────────────────────────────────────────────────────────── */

/**
 * Six roles, because the console has six jobs in it.
 *
 * The split that matters is approve versus launch: the flow separates them
 * into two steps, so the roles separate them too. A product manager designs
 * and launches; the approval it needs comes from somebody else.
 */
export const ROLES = [
  {
    id: 'admin',
    label: 'Administrator',
    line: 'Full access, including the ability to grant it. Kept deliberately small.',
    grants: PERMISSIONS.map((p) => p.id),
  },
  {
    id: 'pm',
    label: 'Product manager',
    line: 'Owns the portfolio: finds the opportunity, builds the cohort, launches the campaign.',
    // Designs and launches, and owns the campaign once it is running — but
    // still cannot approve its own work, which is the point of the approver
    // seat existing at all.
    grants: [
      'pm.opportunities', 'pm.cohorts', 'pm.scans', 'pm.analytics',
      'campaigns.design', 'campaigns.launch', 'campaigns.correct', 'rm.analytics',
    ],
  },
  {
    id: 'rm',
    label: 'Relationship manager',
    line: 'Works one book of customers — the queue, the conversation, and the limit at the end of it.',
    grants: ['rm.queue', 'rm.contact', 'limits.assign', 'rm.analytics'],
  },
  {
    id: 'ops',
    label: 'Ops analyst',
    line: 'Clears the blocked onboarding files: queue work and limits, no outbound campaigns.',
    grants: ['rm.queue', 'limits.assign', 'pm.analytics', 'pm.scans'],
  },
  {
    id: 'approver',
    label: 'Approver',
    line: 'Reads everything a campaign is built from and signs it off. Cannot launch what it approves.',
    grants: ['campaigns.approve', 'pm.analytics', 'pm.scans', 'rm.analytics'],
  },
  {
    id: 'readonly',
    label: 'Read-only',
    line: 'Sees the numbers and nothing that changes them. The default for a new invitation.',
    grants: ['pm.analytics', 'pm.scans', 'rm.analytics'],
  },
]

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]))

export const STATUSES = [
  { id: 'active', label: 'Active', line: 'Signed in and working.' },
  { id: 'invited', label: 'Invited', line: 'Invitation sent, never signed in.' },
  { id: 'suspended', label: 'Suspended', line: 'Access withdrawn, account kept.' },
]

export const TEAMS = [
  'Cards, India', 'South 2', 'North 1', 'West 1',
  'Onboarding Ops', 'Risk Ops', 'Growth Analytics', 'Platform',
]

/* ── The authored users ─────────────────────────────────────────────── */

/**
 * The people the rest of the console already names, plus the ones the access
 * story needs: an administrator, somebody suspended with a reason, somebody
 * invited and still not in, and two users carrying an exception to their role.
 *
 * `extra` and `revoked` are the exceptions — a grant on top of the role, or one
 * taken away from it. Roles are the rule; these are what a real console
 * accumulates around it, and they are why the detail screen has to show
 * effective permissions rather than just the role's own list.
 */
const AUTHORED = [
  {
    id: 'rohan-mehta',
    name: 'Rohan Mehta',
    role: 'pm',
    team: 'Cards, India',
    status: 'active',
    addedOn: '2023-02-14',
    lastActiveMins: 6,
    note: 'Owns the India cards portfolio. Every campaign in the live register was launched from this account.',
  },
  {
    id: 'priya-ranganathan',
    name: 'Priya Ranganathan',
    role: 'rm',
    team: 'South 2',
    status: 'active',
    addedOn: '2023-06-02',
    lastActiveMins: 22,
    note: 'Works the South 2 book — 248 cards, the largest single book in the region.',
  },
  {
    id: 'nandini-shetty',
    name: 'Nandini Shetty',
    role: 'admin',
    team: 'Platform',
    status: 'active',
    addedOn: '2022-11-08',
    lastActiveMins: 88,
    note: 'One of two administrators. Grants and revokes here are logged against this account.',
  },
  {
    id: 'vikram-sethi',
    name: 'Vikram Sethi',
    role: 'admin',
    team: 'Platform',
    status: 'active',
    addedOn: '2022-11-08',
    lastActiveMins: 1180,
    note: 'The second administrator, kept so the first one can be locked out without locking out the console.',
  },
  {
    id: 'meera-kulkarni',
    name: 'Meera Kulkarni',
    role: 'approver',
    team: 'Risk Ops',
    status: 'active',
    addedOn: '2023-09-19',
    lastActiveMins: 240,
    note: 'Signs off campaign spend. Deliberately holds no launch permission — the approval would be worth less if she could act on it herself.',
  },
  {
    id: 'arjun-nair',
    name: 'Arjun Nair',
    role: 'ops',
    team: 'Onboarding Ops',
    status: 'active',
    addedOn: '2024-01-22',
    lastActiveMins: 55,
    extra: ['rm.contact'],
    note: 'Given outbound contact on top of the ops role during the activation backlog in July, and never taken back.',
  },
  {
    id: 'divya-menon',
    name: 'Divya Menon',
    role: 'pm',
    team: 'Growth Analytics',
    status: 'active',
    addedOn: '2024-03-11',
    lastActiveMins: 430,
    revoked: ['campaigns.launch'],
    note: 'Designs cohorts and hands them over. Launch was removed after the June review, which asked that design and release sit with different people.',
  },
  {
    id: 'sameer-bhatia',
    name: 'Sameer Bhatia',
    role: 'rm',
    team: 'North 1',
    status: 'active',
    addedOn: '2024-05-30',
    lastActiveMins: 1620,
    note: 'North 1 book. Highest response rate on the activation journey last quarter.',
  },
  {
    id: 'aditi-verma',
    name: 'Aditi Verma',
    role: 'readonly',
    team: 'Risk Ops',
    status: 'invited',
    addedOn: '2026-09-01',
    lastActiveMins: null,
    note: 'Invited six days ago for the quarterly risk review and has not signed in yet. Invitations expire after fourteen days.',
  },
  {
    id: 'kabir-joshi',
    name: 'Kabir Joshi',
    role: 'rm',
    team: 'West 1',
    status: 'suspended',
    addedOn: '2023-04-17',
    lastActiveMins: 34000,
    note: 'Suspended on 15 August pending an internal transfer. The account is kept rather than deleted so the actions taken under it stay attributable.',
  },
  {
    id: 'ishaan-rao',
    name: 'Ishaan Rao',
    role: 'ops',
    team: 'Onboarding Ops',
    status: 'active',
    addedOn: '2025-02-03',
    lastActiveMins: 130,
    note: 'Clears the awaiting-a-limit pile. Assigns more limits in a week than anyone else in the console.',
  },
  {
    id: 'tara-subramanian',
    name: 'Tara Subramanian',
    role: 'readonly',
    team: 'Growth Analytics',
    status: 'active',
    addedOn: '2025-07-28',
    lastActiveMins: 2900,
    note: 'Reads the funnel for the monthly pack. Read-only by request — she asked not to be able to change anything she reports on.',
  },
]

/* ── The seeded rest ────────────────────────────────────────────────── */

// The console is licensed for sixty seats; fifty-six of them are taken. The
// authored twelve lead the list, the remainder are drawn here.
const TOTAL = 56

// Role mix, as counts out of the drawn population rather than probabilities —
// a probability would let a run come out with no administrators at all.
const ROLE_MIX = [
  ...Array(14).fill('rm'),
  ...Array(10).fill('ops'),
  ...Array(8).fill('readonly'),
  ...Array(7).fill('pm'),
  ...Array(4).fill('approver'),
  ...Array(1).fill('admin'),
]

const TEAM_FOR_ROLE = {
  rm: ['South 2', 'North 1', 'West 1'],
  ops: ['Onboarding Ops', 'Risk Ops'],
  pm: ['Cards, India', 'Growth Analytics'],
  approver: ['Risk Ops', 'Cards, India'],
  readonly: ['Growth Analytics', 'Risk Ops', 'Platform'],
  admin: ['Platform'],
}

// Domain is fictional, and stays fictional — nothing here should resolve.
const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.')
const email = (name) => `${slug(name)}@apexbank.example`

/**
 * A date `days` before the reference day, as an ISO date.
 *
 * The console runs on a fixed Monday in September 2026 — the header stamp says
 * so — and every relative figure on these screens is measured from it, so the
 * screens do not quietly change meaning depending on when the demo is opened.
 */
export const TODAY = new Date('2026-09-07T09:41:00')

const isoDaysAgo = (days) => {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function generated() {
  const taken = new Set(AUTHORED.map((u) => u.name))
  const out = []

  for (let i = 0; out.length < TOTAL - AUTHORED.length; i++) {
    const rnd = mulberry32(hash(`user:${i}`))
    let name = `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`
    // A duplicate name in an access list is worse than a boring one: two rows
    // reading the same is exactly the ambiguity this screen exists to remove.
    if (taken.has(name)) {
      name = `${pick(rnd, FIRST)} ${pick(rnd, LAST)}`
      if (taken.has(name)) continue
    }
    taken.add(name)

    const role = ROLE_MIX[out.length % ROLE_MIX.length]
    const roll = rnd()
    // Four in five accounts are working accounts. The rest split between an
    // invitation still outstanding and access already withdrawn.
    const status = roll > 0.88 ? 'invited' : roll > 0.8 ? 'suspended' : 'active'

    out.push({
      id: `u${String(out.length + 1).padStart(3, '0')}`,
      name,
      role,
      team: pick(rnd, TEAM_FOR_ROLE[role]),
      city: pick(rnd, METROS),
      status,
      addedOn: isoDaysAgo(status === 'invited' ? between(rnd, 1, 12) : between(rnd, 30, 1180)),
      // Invited accounts have never signed in, so they carry no last-active at
      // all rather than a zero that would sort them among the busiest.
      lastActiveMins: status === 'invited'
        ? null
        : status === 'suspended'
          ? between(rnd, 12000, 60000)
          : between(rnd, 3, 9000),
      extra: rnd() > 0.93 ? [pick(rnd, ['rm.contact', 'pm.scans', 'limits.assign'])] : [],
      revoked: rnd() > 0.95 ? [pick(rnd, ['campaigns.launch', 'limits.assign'])] : [],
    })
  }

  return out
}

/** Everyone with a seat, authored first, then the drawn remainder. */
export const USERS = [
  ...AUTHORED.map((u) => ({
    ...u,
    city: null,
    extra: u.extra ?? [],
    revoked: u.revoked ?? [],
    featured: true,
  })),
  ...generated().map((u) => ({ ...u, email: email(u.name), note: null, featured: false })),
].map((u) => ({ ...u, email: u.email ?? email(u.name) }))

export const USER_BY_ID = Object.fromEntries(USERS.map((u) => [u.id, u]))

/* ── Activity ───────────────────────────────────────────────────────── */

// What each permission looks like in a log line. An activity trail drawn from
// the permissions a person actually holds stays honest: a read-only account
// can never show up as having launched something.
const ACTIONS = {
  'rm.queue': ['Ran agent analysis', 'Opened the customer queue', 'Reordered the queue by value'],
  'rm.contact': ['Approved and sent a recommendation', 'Edited a drafted message before sending'],
  'limits.assign': ['Assigned a credit limit', 'Accepted the recommended limit'],
  'rm.analytics': ['Read relationship performance', 'Exported the weekly book summary'],
  'pm.opportunities': ['Opened an opportunity', 'Advanced an opportunity to design'],
  'pm.cohorts': ['Rebuilt a cohort', 'Validated a cohort against sample members'],
  'pm.scans': ['Read the overnight scan register'],
  'pm.analytics': ['Read the onboarding funnel', 'Opened an applicant file', 'Filtered the open book'],
  'campaigns.approve': ['Approved a campaign', 'Sent a campaign back for revision'],
  'campaigns.launch': ['Launched a campaign', 'Paused a live campaign'],
  'admin.users': ['Changed a role', 'Suspended an account', 'Sent an invitation'],
}

const SESSION_PLACES = ['Mumbai · web', 'Bengaluru · web', 'Delhi · web', 'Chennai · web', 'Pune · web']

/**
 * A person's recent activity, drawn from the permissions they hold.
 *
 * Built on demand and only for the detail screen — nobody needs fifty-six
 * activity trails to render a list.
 */
export function activityFor(user, perms) {
  if (user.status === 'invited') return []

  const rnd = mulberry32(hash(`act:${user.id}`))
  const pool = perms.flatMap((p) => (ACTIONS[p] ?? []).map((label) => ({ label, perm: p })))
  if (pool.length === 0) return []

  const rows = []
  let mins = user.lastActiveMins ?? 60
  // Drawn once. In the loop condition it is re-drawn every iteration, which
  // both skews the row count away from a uniform 5–9 and burns an extra draw
  // per pass — shifting every pick that follows and quietly breaking the
  // seeded, reproducible contract this module is built on.
  const count = between(rnd, 5, 9)
  for (let i = 0; i < count; i++) {
    const a = pick(rnd, pool)
    rows.push({
      id: `${user.id}-a${i}`,
      label: a.label,
      perm: a.perm,
      mins,
      where: pick(rnd, SESSION_PLACES),
    })
    mins += between(rnd, 25, 2600)
  }
  return rows
}
