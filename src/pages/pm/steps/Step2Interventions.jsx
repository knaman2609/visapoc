import { useMemo, useState } from 'react'
import { PM_COHORTS, PM_COHORT_SCAN, crore, offerMetrics, roi } from '../../../data/cohorts.js'
import {
  COVERAGE, PLANS, SEGMENTS, allPlans, asCohort, findSegment,
} from '../../../data/coverage.js'
import { PM_OBJECTIVES, fmtIN } from '../../../data/portfolio.js'
import Button from '../../../components/ui/Button.jsx'
import Spinner from '../../../components/ui/Spinner.jsx'
import CohortModal from '../../../components/drawers/CohortModal.jsx'
import IterateModal from '../../../components/drawers/IterateModal.jsx'
import stepStyles from './step.module.css'
import styles from './Step2Interventions.module.css'
import StepActions from '../StepActions.jsx'

const CONF_LABEL = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }

const COVERAGE_FILTERS = [
  { id: 'all', label: 'Both' },
  { id: 'held', label: 'Holds an offer' },
  { id: 'open', label: 'Nothing in hand' },
]

const ALL_CAMPAIGNS = SEGMENTS.flatMap((s) => s.campaigns)
const CEIL = {
  targeted: Math.max(...ALL_CAMPAIGNS.map((c) => c.targeted)),
  profitCr: Math.max(...ALL_CAMPAIGNS.map((c) => c.profitCr)),
  investCr: Math.max(...ALL_CAMPAIGNS.map((c) => c.investCr)),
  roiX: Math.max(...ALL_CAMPAIGNS.map((c) => c.roiX)),
}

export default function Step2Interventions({ flow }) {
  const [cohortFilter, setCohortFilter] = useState('all')
  const [covFilter, setCovFilter] = useState('all')
  const [segId, setSegId] = useState(SEGMENTS[0].id)
  const [campId, setCampId] = useState(null)
  const [iterating, setIterating] = useState(null)

  const done = flow.cohortN >= PM_COHORT_SCAN.length
  const objective = PM_OBJECTIVES.find((o) => o.id === flow.objective) || PM_OBJECTIVES[0]
  const openCohort = PM_COHORTS.find((c) => c.id === flow.openCohort) || null

  const list = SEGMENTS.filter(
    (s) =>
      (cohortFilter === 'all' || s.cohortId === cohortFilter) &&
      (covFilter === 'all' || s.coverage === covFilter),
  )

  // The selected segment has to survive a filter change that hides it.
  const segment = list.find((s) => s.id === segId) || list[0] || findSegment(segId) || SEGMENTS[0]
  const segCohort = useMemo(
    () => asCohort(segment.cohort, segment.members),
    [segment],
  )
  const campaigns = segment.campaigns.map((c) => ({
    ...c,
    live: offerMetrics(c, segCohort, flow.tunings[c.id]),
  }))
  const campaign = campaigns.find((c) => c.id === campId) || campaigns[0]

  const plans = useMemo(
    () => (segment.coverage === 'open' && campaign
      ? allPlans({ metrics: campaign.live, cohort: segment.cohort })
      : null),
    [segment, campaign],
  )

  if (!done) return <Loading n={flow.cohortN} objective={objective} />

  const pickSegment = (s) => {
    setSegId(s.id)
    setCampId(null)
  }

  const approve = () => {
    flow.selectCampaign(segment, campaign, campaign.live.tuned ? campaign.live : undefined)
    flow.goStep(3)
  }

  return (
    <div className={stepStyles.wrap}>
      <div className={stepStyles.head}>
        <div>
          <div className={stepStyles.kicker}>Suggested interventions</div>
          <h1 className={stepStyles.h1}>What the agent recommends running</h1>
          <div className={stepStyles.sub}>
            {fmtIN(COVERAGE.total)} at-risk cardholders · cut into {SEGMENTS.length} segments by
            spend and by what is already on the card · {ALL_CAMPAIGNS.length} campaigns modelled
          </div>
        </div>
      </div>

      <div className={styles.objLine}>
        <span className={styles.objKick}>Planning against</span>
        <span className={styles.objGoal}>{objective.goal}</span>
        <span className={styles.objSep} aria-hidden="true">·</span>
        <span className={styles.objConstraint}>{objective.constraint}</span>
      </div>

      <Coverage />

      {/* ── ① The slice ── */}
      <section className={styles.section}>
        <div className={styles.sectHead}>
          <div>
            <div className={styles.sectKick}>Step one</div>
            <h2 className={styles.sectH2}>Pick the people</h2>
          </div>
          <div className={styles.filters}>
            <button
              type="button"
              className={`${styles.fChip} ${cohortFilter === 'all' ? styles.fChipOn : ''}`}
              onClick={() => setCohortFilter('all')}
            >
              All cohorts
            </button>
            {PM_COHORTS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.fChip} ${cohortFilter === c.id ? styles.fChipOn : ''}`}
                onClick={() => setCohortFilter(c.id)}
              >
                {c.tag}
              </button>
            ))}
            <span className={styles.fSep} aria-hidden="true" />
            {COVERAGE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.fChip} ${covFilter === f.id ? styles.fChipOn : ''}`}
                onClick={() => setCovFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.list}>
          <div className={styles.listHead}>
            <div />
            <div>Segment</div>
            <div className={styles.numHead}>Cardholders</div>
            <div>What is on their card</div>
            <div className={styles.numHead}>Campaigns</div>
            <div />
          </div>

          {list.map((s) => {
            const on = s.id === segment.id
            return (
              <button
                key={s.id}
                type="button"
                className={`${styles.row} ${on ? styles.rowOn : ''} ${styles[`cov_${s.coverage}`]}`}
                onClick={() => pickSegment(s)}
                aria-current={on}
              >
                <span className={`${styles.tag} ${styles[`tag_${s.cohort.band}`]}`}>{s.tag}</span>

                <span className={styles.cell}>
                  <span className={styles.label}>{s.cohortLabel}</span>
                  <span className={`${styles.covPill} ${styles[`pill_${s.coverage}`]}`}>
                    {s.coverage === 'held' ? 'holds an offer' : 'nothing in hand'}
                  </span>
                </span>

                <span className={styles.count}>{fmtIN(s.count)}</span>

                <span className={styles.inHand}>
                  {s.inHand
                    ? <span className={styles.inHandName}>{s.inHand}</span>
                    : <span className={styles.inHandNone}>No benefit in hand</span>}
                </span>

                <span className={styles.campCount}>{s.campaigns.length}</span>

                <span className={styles.open}>
                  {on ? 'Selected' : 'Select'} <span aria-hidden="true">→</span>
                </span>
              </button>
            )
          })}
          {list.length === 0 && (
            <div className={styles.empty}>No segment matches those filters.</div>
          )}
        </div>
      </section>

      {/* ── ② The campaign for those people ── */}
      <section className={styles.section}>
        <div className={styles.sectHead}>
          <div>
            <div className={styles.sectKick}>Step two</div>
            <h2 className={styles.sectH2}>Pick what they get</h2>
          </div>
          <button
            type="button"
            className={styles.cohortLink}
            onClick={() => flow.pickCohort(segment.cohortId)}
          >
            Read the {segment.cohortLabel.toLowerCase()} cardholders
            <span className={styles.cohortLinkGo} aria-hidden="true">→</span>
          </button>
        </div>

        <div className={styles.forSeg}>
          <span className={`${styles.tagSm} ${styles[`tag_${segment.cohort.band}`]}`}>{segment.tag}</span>
          <b>{segment.title}</b>
          <span className={styles.forSegN}>{fmtIN(segment.count)} cardholders</span>
          <span className={styles.forSegTrait}>{segment.trait}</span>
        </div>

        <div className={styles.split}>
          <div className={styles.rankCol}>
            <div className={styles.rankBar}>
              {segment.coverage === 'held'
                ? 'The benefit they already hold'
                : `${campaigns.length} offers the agent modelled`}
            </div>
            <div className={styles.rankList}>
              {campaigns.map((c, i) => (
                <CampaignRow
                  key={c.id}
                  c={c}
                  rank={i + 1}
                  held={segment.coverage === 'held'}
                  on={campaign?.id === c.id}
                  onPick={() => setCampId(c.id)}
                />
              ))}
            </div>
          </div>

          {campaign && (
            <Detail
              c={campaign}
              segment={segment}
              plans={plans}
              plan={flow.plan}
              onPlan={flow.pickPlan}
              onTune={() => setIterating(campaign)}
              onReset={() => flow.clearTuning(campaign.id)}
              onApprove={approve}
            />
          )}
        </div>
      </section>

      <StepActions>
        <Button variant="secondary" onClick={flow.goBack}>← Cohort analysis</Button>
        <Button
          variant="primary"
          size="lg"
          className={stepStyles.actionsRight}
          onClick={approve}
        >
          Design the campaign →
        </Button>
      </StepActions>

      {iterating && (
        <IterateModal
          offer={iterating}
          cohort={segCohort}
          initial={flow.tunings[iterating.id]}
          onSave={(opts) => {
            flow.setTuning(iterating.id, opts)
            setIterating(null)
          }}
          onApprove={(opts, result) => {
            flow.setTuning(iterating.id, opts)
            flow.selectCampaign(segment, iterating, result)
            setIterating(null)
            flow.goStep(3)
          }}
          onClose={() => setIterating(null)}
        />
      )}

      {openCohort && (
        <CohortModal
          cohort={openCohort}
          excluded={!!flow.bucketEx[openCohort.id]}
          onToggle={() => flow.toggleBucket(openCohort.id)}
          onClose={flow.closeCohort}
        />
      )}
    </div>
  )
}

/* ── Offer coverage ─────────────────────────────────────────────────── */

function Coverage() {
  const heldPct = Math.round(COVERAGE.heldPct * 100)
  return (
    <section className={styles.cov}>
      <div className={styles.covHead}>
        <div>
          <div className={styles.sectKick}>Offer coverage</div>
          <h2 className={styles.sectH2}>What they already hold</h2>
        </div>
        <div className={styles.sectHint}>
          Checked against every benefit live on the card and unused for 90 days
        </div>
      </div>

      <div className={styles.covBar}>
        <div className={styles.covHeld} style={{ width: `${heldPct}%` }} />
        <div className={styles.covOpen} style={{ width: `${100 - heldPct}%` }} />
      </div>

      <div className={styles.covCards}>
        <div className={`${styles.covCard} ${styles.covCardHeld}`}>
          <div className={styles.covKick}>Already hold an unused benefit</div>
          <div className={styles.covV}>{fmtIN(COVERAGE.held)}</div>
          <div className={styles.covPct}>{heldPct}% of the at-risk group</div>
          <div className={styles.covSay}>
            They were given this at issue and have never used it. Paying them a fresh incentive
            buys something they already have — so the push carries the knowledge, not an offer.
          </div>
        </div>
        <div className={`${styles.covCard} ${styles.covCardOpen}`}>
          <div className={styles.covKick}>Nothing in hand</div>
          <div className={styles.covV}>{fmtIN(COVERAGE.open)}</div>
          <div className={styles.covPct}>{100 - heldPct}% of the at-risk group</div>
          <div className={styles.covSay}>
            No benefit on the card that answers why they are leaving. These are the cardholders a
            paid offer is actually for, and the ones worth spending the budget on.
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── One campaign in the list ───────────────────────────────────────── */

function CampaignRow({ c, rank, held, on, onPick }) {
  const m = c.live
  return (
    <button
      type="button"
      className={`${styles.rankRow} ${on ? styles.rankOn : ''}`}
      onClick={onPick}
      aria-current={on}
    >
      <span className={`${styles.rankNo} ${held ? styles.rankNoAware : ''}`}>
        {String(rank).padStart(2, '0')}
      </span>

      <span className={styles.rankMain}>
        <span className={styles.rankName}>
          {c.name}
          {m.tuned && <span className={styles.tunedDot} title="Tuned by you">◆</span>}
        </span>
        <span className={styles.rankMeta}>
          {fmtIN(m.targeted)} targeted
          {held && <span className={styles.heldFlag}>no incentive bought</span>}
          {c.belowHurdle && <span className={styles.belowFlag}>below hurdle</span>}
        </span>
        <span className={styles.rankTrack}>
          <span
            className={`${styles.rankFill} ${held ? styles.rankFillAware : ''}`}
            style={{ width: `${Math.max(3, (m.profitCr / CEIL.profitCr) * 100)}%` }}
          />
        </span>
      </span>

      <span className={styles.rankNums}>
        <span className={styles.rankProfit}>{crore(m.profitCr)}</span>
        <span
          className={`${styles.rankRoi} ${c.belowHurdle ? styles.roiBad : ''} ${held ? styles.roiAware : ''}`}
        >
          {roi(m.roiX)}
        </span>
      </span>
    </button>
  )
}

/* ── The campaign in focus ──────────────────────────────────────────── */

function Detail({ c, segment, plans, plan, onPlan, onTune, onReset, onApprove }) {
  const m = c.live
  const held = segment.coverage === 'held'

  return (
    <div className={styles.detail} key={c.id}>
      <div className={styles.detailTop}>
        <span className={`${styles.detailRank} ${held ? styles.detailRankAware : ''}`}>
          {held ? 'Costs almost nothing to run' : 'For the people with nothing in hand'}
        </span>
        <span className={`${styles.conf} ${styles[`conf_${c.confidence}`]}`}>
          {CONF_LABEL[c.confidence]}
        </span>
      </div>

      <h3 className={styles.detailName}>{c.name}</h3>

      <div className={styles.detailCohort}>
        <span className={styles.detailAffects}>
          reaches <b>{fmtIN(m.targeted)}</b> of this segment&apos;s {fmtIN(segment.count)}
        </span>
        {m.tuned && (
          <span className={styles.tunedPill}>
            Tuned by you
            <button type="button" className={styles.tunedReset} onClick={onReset}>reset</button>
          </span>
        )}
      </div>

      {held && (
        <div className={styles.held}>
          <div className={styles.heldKick}>Already on the card</div>
          <div className={styles.heldName}>{segment.inHand}</div>
          <div className={styles.heldLine}>{segment.inHandLine}</div>
        </div>
      )}

      <p className={styles.detailDesc}>{c.desc}</p>

      <div className={styles.metrics}>
        <Metric k="Targeted" v={fmtIN(m.targeted)} was={m.tuned ? fmtIN(c.targeted) : null}
          pct={(m.targeted / CEIL.targeted) * 100} />
        <Metric k="Incremental profit" v={crore(m.profitCr)} was={m.tuned ? crore(c.profitCr) : null}
          pct={(m.profitCr / CEIL.profitCr) * 100} tone="ok" />
        <Metric k="Investment" v={crore(m.investCr)} was={m.tuned ? crore(c.investCr) : null}
          pct={(m.investCr / CEIL.investCr) * 100} tone="cost" />
        <Metric k="Return on investment" v={roi(m.roiX)} was={m.tuned ? roi(c.roiX) : null}
          pct={(m.roiX / CEIL.roiX) * 100} tone={c.belowHurdle ? 'bad' : held ? 'ok' : 'warn'} />
      </div>

      {held && (
        <div className={styles.awareNote}>
          No reward is paid out — the only cost is reaching them and honouring a benefit the card
          already carries. That is why it returns {roi(m.roiX)} on a fraction of the budget.
        </div>
      )}

      {c.belowHurdle && (
        <div className={styles.hurdle}>
          Below the bank&apos;s RAROC hurdle — the agent ranked it, but does not recommend it.
        </div>
      )}

      {/* The other half of the cohort is a decision, not a footnote. */}
      {plans && (
        <div className={styles.pair}>
          <div className={styles.pairHead}>
            <span className={styles.pairKick}>And the rest of the cohort?</span>
            <span className={styles.pairSay}>
              {fmtIN(plans.paired.heldHere)} more {segment.cohortLabel.toLowerCase()} cardholders
              already hold an unused benefit. They are not in this segment — but they are in this
              cohort.
            </span>
          </div>

          {PLANS.map((p) => {
            const on = plan === p.id
            const v = plans[p.id]
            return (
              <button
                key={p.id}
                type="button"
                className={`${styles.pairOpt} ${on ? styles.pairOptOn : ''}`}
                onClick={() => onPlan(p.id)}
                aria-pressed={on}
              >
                <span className={`${styles.pairRadio} ${on ? styles.pairRadioOn : ''}`} aria-hidden="true" />
                <span className={styles.pairMain}>
                  <span className={styles.pairLabel}>
                    {p.label}
                    {p.recommended && <span className={styles.recTag}>agent&apos;s pick</span>}
                  </span>
                  <span className={styles.pairNote}>{p.note}</span>
                  <span className={styles.pairNums}>
                    <span className={styles.pairNum}>
                      <span className={styles.pairNumK}>Reaches</span>
                      <span className={styles.pairNumV}>{fmtIN(v.targeted)}</span>
                    </span>
                    <span className={styles.pairNum}>
                      <span className={styles.pairNumK}>Spend</span>
                      <span className={`${styles.pairNumV} ${styles.pairSpend}`}>{crore(v.investCr)}</span>
                    </span>
                    <span className={styles.pairNum}>
                      <span className={styles.pairNumK}>Profit</span>
                      <span className={`${styles.pairNumV} ${styles.pairProfit}`}>{crore(v.profitCr)}</span>
                    </span>
                    <span className={styles.pairNum}>
                      <span className={styles.pairNumK}>Return</span>
                      <span className={styles.pairNumV}>{roi(v.roiX)}</span>
                    </span>
                  </span>
                </span>
              </button>
            )
          })}

          <div className={styles.pairFoot}>
            {plan === 'paired' && (
              <>
                <b>{crore(plans.all.investCr - plans.paired.investCr)} less</b> than paying the
                incentive to all {fmtIN(plans.all.targeted)}, for{' '}
                {Math.round((plans.paired.profitCr / plans.all.profitCr) * 100)}% of the profit —
                because the holders are activated, not bought.
              </>
            )}
            {plan === 'open' && (
              <>
                The {fmtIN(plans.paired.heldHere)} holders are left alone.{' '}
                <b>{crore(plans.paired.profitCr - plans.open.profitCr)}</b> of profit sits
                unclaimed for {crore(plans.paired.investCr - plans.open.investCr)} of reach.
              </>
            )}
            {plan === 'all' && (
              <>
                <b>{crore(plans.all.investCr - plans.paired.investCr)} more</b> than running both,
                to buy an incentive for {fmtIN(plans.paired.heldHere)} people who already hold one.
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.detailActions}>
        {!held && (
          <Button variant="secondary" onClick={onTune}>
            ↻ {m.tuned ? 'Keep tuning' : 'Iterate with agent'}
          </Button>
        )}
        <Button variant="primary" onClick={onApprove}>
          ✓ {held ? 'Push this to them' : plans && plan === 'paired' ? 'Approve both pushes' : 'Approve & build campaign'}
        </Button>
      </div>
    </div>
  )
}

function Metric({ k, v, was, pct, tone }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricK}>{k}</div>
      <div className={`${styles.metricV} ${tone ? styles[`tone_${tone}`] : ''}`}>{v}</div>
      <div className={styles.metricTrack}>
        <span
          className={`${styles.metricFill} ${tone ? styles[`mf_${tone}`] : ''}`}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </div>
      <div className={styles.metricWas}>{was ? `was ${was}` : ' '}</div>
    </div>
  )
}

/* ── Loader ─────────────────────────────────────────────────────────── */

function Loading({ n, objective }) {
  return (
    <div className={stepStyles.wrap}>
      <div className={styles.loadWrap}>
        <div className={styles.loadHead}>
          <Spinner />
          <div>
            <h1 className={styles.loadH1}>Identifying cohorts and agent interventions</h1>
            <div className={styles.loadSub}>
              Working against your objective — {objective.goal.toLowerCase()}, {objective.constraint.toLowerCase()}.
            </div>
          </div>
        </div>

        <div className={styles.loadSteps}>
          {PM_COHORT_SCAN.map((s, i) => {
            const state = i < n ? 'done' : i === n ? 'busy' : 'todo'
            return (
              <div key={s.label} className={`${styles.loadStep} ${styles[`ls_${state}`]}`}>
                <div className={styles.loadMark}>
                  {state === 'done' ? '✓' : state === 'busy' ? <Spinner size="sm" /> : ''}
                </div>
                <div className={styles.loadLabel}>{s.label}</div>
                <div className={styles.loadResult}>{state === 'done' ? s.result : ''}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
