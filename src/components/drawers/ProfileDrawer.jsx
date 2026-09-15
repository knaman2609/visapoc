import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { findCustomer } from '../../data/customers.js'
import { findProfile } from '../../data/profiles.js'
import { ONBOARD } from '../../data/onboard.js'
import { Sparkles } from 'lucide-react'
import PhoneShell from '../ui/PhoneShell.jsx'
import Spinner from '../ui/Spinner.jsx'
import Checkmark from '../ui/Checkmark.jsx'
import { useAppContext } from '../../state/useApp.js'
import { useProfileAnalysis } from '../../state/useProfileAnalysis.js'
import { applicantById } from '../../state/useOnboarding.js'
import CustomerPhone from './CustomerPhone.jsx'
import LimitRecommendation from './LimitRecommendation.jsx'
import ProfileGrid from './ProfileGrid.jsx'
import styles from './ProfileDrawer.module.css'

const DEFAULT_LINES = [
  { tag: '1 · ONBOARDING', label: 'Reading Account Aggregator, salary, bureau and KYC data' },
  { tag: '2 · POTENTIAL VALUE', label: 'Computing total potential value' },
  { tag: '3 · RISK × PROFITABILITY', label: 'Tagging position in the grid' },
]

function initialsOf(name) {
  if (!name) return ''
  return name.split(' ').map((w) => w[0]).join('')
}

const CARD_BY_VARIANT = {
  'Visa Platinum': 'Platinum Credit',
  'Visa Signature': 'Signature Credit',
  'Visa Infinite': 'Infinite Credit',
}

function segmentFor(variant) {
  if (variant === 'Visa Infinite') return 'HNI'
  if (variant === 'Visa Signature') return 'Affluent'
  return 'Mass affluent'
}

function customerFromApplicant(a) {
  const parts = a.meta ? a.meta.split(' · ') : []
  const variant = a.variant ?? parts[2] ?? null
  return {
    name: a.name,
    card: CARD_BY_VARIANT[variant] || 'Credit card',
    segment: segmentFor(variant),
    since: 'Applying now',
  }
}

export default function ProfileDrawer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const profileId = searchParams.get('profile')
  const applicantId = searchParams.get('applicant')
  const baseCustomer = profileId ? findCustomer(profileId) : null
  const profile = profileId ? findProfile(profileId) : null
  // When Act comes from the onboarding drawer, the applicant's own identity
  // overrides the template customer so the lifecycle view reads as the
  // person who was selected, not the template's default cardholder.
  const applicant = applicantId ? applicantById(applicantId) : null
  const customer = applicant && baseCustomer
    ? { ...baseCustomer, ...customerFromApplicant(applicant) }
    : baseCustomer

  const { limitSet, limitToast, assignLimit, dismissToast } = useAppContext()
  const { pStep, pDone } = useProfileAnalysis(profile)

  const close = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('profile')
    next.delete('applicant')
    setSearchParams(next, { replace: true })
    dismissToast()
  }

  // Close on Escape.
  useEffect(() => {
    if (!profile) return undefined
    const h = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  if (!profile || !customer) return null

  const rec = profile.rec || null
  const total = rec ? 4 : 3
  const initials = initialsOf(customer.name)
  const assigned = !!limitSet[profileId]
  const showToast = limitToast === profileId

  const baseLines = profile.lines || DEFAULT_LINES
  const linesWithRec = baseLines
    .concat(rec ? [{ tag: `4 · ${rec.tag}`, label: rec.thinkLine || 'Deriving the recommended next action' }] : [])
    .slice(0, total)
  const thinkLines = linesWithRec.slice(0, Math.min(pStep + 1, total)).map((l, i) => {
    const busy = i === pStep && pStep < total
    return { tag: l.tag, label: busy ? `${l.label}…` : l.label, busy, ok: !busy }
  })

  const basis = rec ? (rec.basis || profile.limitBasis || []) : []
  const hasSystems = !!profile.systems
  const hasModels = !!profile.models

  return (
    <>
      <div className={styles.backdrop} onClick={close} />

      <div className={styles.phoneWrap}>
        <div className={styles.phoneKick}>CUSTOMER&apos;S OWN VIEW</div>
        <PhoneShell size="sm" screenBg="var(--c-surface-hi3)" showStatusBar>
          <CustomerPhone
            customer={customer}
            profile={profile}
            initials={initials}
            rec={rec}
            limitAssigned={assigned}
            showToast={showToast}
            onDismissToast={dismissToast}
          />
        </PhoneShell>
      </div>

      <aside className={styles.panel} aria-label="Customer profile">
        <div className={styles.pHead}>
          <div className={styles.pHeadLeft}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.hCol}>
              <div className={styles.hName}>{customer.name}</div>
              <div className={styles.hSub}>
                {customer.card} · {customer.segment} · Since {customer.since}
              </div>
              {profile.newLabel && <div className={styles.hNew}>{profile.newLabel}</div>}
            </div>
          </div>
          <button type="button" className={styles.close} onClick={close}>✕</button>
        </div>

        <div className={styles.scroll}>
          <div className={styles.thinkBox}>
            <div className={styles.thinkHead}>
              <Sparkles
                className={pDone ? styles.starDone : styles.starIcon}
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              <div className={styles.thinkKick}>VISA AGENTIC INTELLIGENCE</div>
              {pDone && <div className={styles.thinkDone}>ANALYSIS COMPLETE</div>}
            </div>
            <div className={styles.thinkList}>
              {thinkLines.map((l, i) => (
                <div key={`${i}-${l.tag}`} className={styles.thinkRow}>
                  {l.busy ? <Spinner size="sm" /> : <Checkmark size="xs" />}
                  <div className={styles.thinkTag}>{l.tag}</div>
                  <div className={styles.thinkLabel}>{l.label}</div>
                </div>
              ))}
            </div>
          </div>

          {pDone && (
            <div className={styles.summaryRow}>
              <div className={styles.sumCell}>
                <div className={styles.sumK}>CREDIT LIMIT</div>
                <div className={styles.sumV}>{profile.limit}</div>
              </div>
              <div className={styles.sumCell}>
                <div className={styles.sumK}>BUREAU</div>
                <div className={styles.sumV}>{profile.bureau}</div>
              </div>
              <div className={styles.sumCell}>
                <div className={styles.sumK}>TENURE</div>
                <div className={styles.sumV}>{profile.tenure}</div>
              </div>
            </div>
          )}

          {pDone && hasSystems && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionNum}>1</div>
                <div>
                  <div className={styles.sectionTitle}>Data gathered</div>
                  <div className={styles.sectionSub}>
                    Periodic and behavioural traits pulled live across the Visa ecosystem, unified into one action.
                  </div>
                </div>
              </div>

              <div className={styles.systems}>
                {profile.systems.map((s) => <div key={s} className={styles.system}>{s}</div>)}
              </div>

              <div className={styles.traits}>
                {profile.traits.map((t) => (
                  <div key={t.body} className={styles.trait}>
                    <div className={styles.traitK}>{t.kicker}</div>
                    <div className={styles.traitBody}>{t.body}</div>
                    {t.note && <div className={styles.traitNote}>{t.note}</div>}
                  </div>
                ))}
              </div>

              <div className={styles.tracked}>TRACKED DATA POINTS</div>
              <div className={styles.points}>
                {profile.points.map((pt) => (
                  <div key={pt.k} className={styles.point}>
                    <div className={styles.pointK}>{pt.k}</div>
                    <div className={styles.pointV}>{pt.v}</div>
                    <div className={styles.pointSrc}>{pt.src}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pDone && hasModels && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionNum}>2</div>
                <div>
                  <div className={styles.sectionTitle}>Models score, risk gates decide</div>
                  <div className={styles.sectionSub}>
                    Three models rank the play; three gates approve or hold it. One action wins.
                  </div>
                </div>
              </div>

              <div className={styles.models}>
                {profile.models.map((m) => (
                  <div key={m.k} className={styles.model}>
                    <div className={styles.modelHead}>
                      <div className={styles.modelK}>{m.k}</div>
                      <div className={styles.modelV}>{m.v}</div>
                    </div>
                    <div className={styles.modelBar}>
                      <div className={styles.modelFill} style={{ width: m.pct }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.tracked}>RISK GATES</div>
              <div className={styles.gates}>
                {profile.gates.map((g) => (
                  <div key={g.k} className={styles.gate}>
                    <div className={styles.gateK}>{g.k}</div>
                    <div className={styles.gateHead}>
                      {g.pass && <div className={`${styles.gateDot} ${styles.gateDotPass}`} />}
                      {g.watch && <div className={`${styles.gateDot} ${styles.gateDotWatch}`} />}
                      <div className={styles.gateV}>{g.v}</div>
                    </div>
                    <div className={styles.gateNote}>{g.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pDone && !hasSystems && (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionNum}>1</div>
                  <div>
                    <div className={styles.sectionTitle}>Onboarding</div>
                    <div className={styles.sectionSub}>Foundational data captured the moment the customer enters.</div>
                  </div>
                </div>
                <div className={styles.onboardGrid}>
                  {ONBOARD.map((o) => (
                    <div key={o.k} className={styles.onboardCell}>
                      <div className={styles.onboardBar} />
                      <div className={styles.onboardK}>{o.k}</div>
                      <div className={styles.onboardV}>{o.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionNum}>2</div>
                  <div>
                    <div className={styles.sectionTitle}>Total potential value computed</div>
                    <div className={styles.sectionSub}>The agent converts onboarding data into total potential value.</div>
                  </div>
                </div>
                <div className={styles.pvBox}>
                  <div className={styles.pvRow}>
                    <div className={styles.pvCell}>
                      <div className={styles.pvK}>INCOME CAPACITY</div>
                      <div className={styles.pvV}>{profile.income}</div>
                    </div>
                    <div className={styles.pvOp}>−</div>
                    <div className={styles.pvCell}>
                      <div className={styles.pvK}>OBLIGATIONS</div>
                      <div className={styles.pvV}>{profile.oblig}</div>
                    </div>
                  </div>
                  <div className={`${styles.pvRow} ${styles.pvRowBorder}`}>
                    <div className={styles.pvCell}>
                      <div className={styles.pvK}>SPEND POTENTIAL</div>
                      <div className={styles.pvV}>{profile.spend}</div>
                    </div>
                    <div className={styles.pvOp}>→</div>
                    <div className={styles.pvOut}>
                      <div className={styles.pvOutK}>POTENTIAL VALUE</div>
                      <div className={styles.pvOutV}>{profile.pv}</div>
                    </div>
                  </div>
                  <div className={styles.pvSeed}>↓ Seeds the customer&apos;s starting cell in the grid below</div>
                </div>
              </div>
            </>
          )}

          {pDone && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionNum}>3</div>
                <div>
                  <div className={styles.sectionTitle}>Tagged in the risk × profitability grid</div>
                  <div className={styles.sectionSub}>
                    Every cardholder sits in this grid and is tracked live as they move.
                  </div>
                </div>
              </div>
              <ProfileGrid cell={profile.cell} from={profile.from} initials={initials} note={profile.note} />
            </div>
          )}

          {pDone && rec && (
            <div className={styles.sectionLast}>
              <div className={styles.sectionHead}>
                <div className={`${styles.sectionNum} ${styles.sectionNumActive}`}>4</div>
                <div>
                  <div className={styles.sectionTitle}>{rec.secTitle}</div>
                  <div className={styles.sectionSub}>{rec.secSub}</div>
                </div>
              </div>
              <LimitRecommendation
                rec={rec}
                basis={basis}
                assigned={assigned}
                onAssign={() => assignLimit(profileId)}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
