import { useMemo, useState } from 'react'
import { fmtIN } from '../../../data/portfolio.js'
import { crore, roi } from '../../../data/cohorts.js'
import { PLANS, allPlans } from '../../../data/coverage.js'
import { CHANNELS, ROUTE_MODES, SEND_WINDOWS, routingInsight } from '../../../data/agent.js'
import { buildCampaign, dropLeg, legKey, legMap, legPrefix } from '../../../data/campaign.js'
import Button from '../../../components/ui/Button.jsx'
import JourneyBuilder from '../../../components/drawers/JourneyBuilder.jsx'
import ComparePlans from '../../../components/drawers/ComparePlans.jsx'
import stepStyles from './step.module.css'
import styles from './Step3Design.module.css'
import StepActions from '../StepActions.jsx'

const rupee = (n) => `₹${fmtIN(Math.round(n))}`

function SparkIcon({ className = '' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
      <path d="M19 15l.85 2.65L22.5 18.5l-2.65.85L19 22l-.85-2.65L15.5 18.5l2.65-.85z" />
    </svg>
  )
}

/**
 * What was decided upstream, where, and by whom. Read, not edited — this step
 * is a consequence of these, not a second chance to change them.
 */
function trailOf(c) {
  return [
    {
      id: 'segment',
      kind: 'Segment',
      step: 'Step 02 · you picked',
      value: c.segment.title,
      note: `${fmtIN(c.segment.count)} cardholders · ${c.segment.trait}`,
    },
    {
      id: 'inhand',
      kind: 'On their card',
      step: 'Agent checked',
      value: c.segment.inHand || 'Nothing in hand',
      note: c.segment.inHandLine,
    },
    {
      id: 'objective',
      kind: 'Objective',
      step: 'Step 02 · you set',
      value: c.objective.goal,
      note: c.objective.constraint,
    },
    {
      id: 'campaign',
      kind: c.isAware ? 'Awareness push' : 'Campaign',
      step: c.campaign.tuned ? 'Step 02 · you iterated' : 'Step 02 · you approved',
      value: c.isAware ? c.campaign.name : c.planDef.label,
      note: c.legs.map((l) => `${l.campaign.name} → ${fmtIN(l.audience)}`).join(' · '),
    },
  ]
}

export default function Step3Design({ flow }) {
  const [building, setBuilding] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [legTab, setLegTab] = useState('paid')

  const c = useMemo(() => buildCampaign(flow), [flow])
  const { legs, totals, out, mode, seq } = c

  const leg = legs.find((l) => l.id === legTab) || legs[0]
  const plan = leg.plan
  const picked = c.channels

  // Every plan priced, so the split decision keeps its consequence on screen.
  const plans = useMemo(
    () => (c.isAware ? null : allPlans({ metrics: c.campaign, cohort: c.cohort })),
    [c.isAware, c.campaign, c.cohort],
  )

  // The same campaign under each routing strategy, so the choice is priced.
  const byMode = useMemo(
    () => Object.fromEntries(
      ROUTE_MODES.map((m) => [m.id, buildCampaign({ ...flow, routeMode: m.id })]),
    ),
    [flow],
  )

  const tuned = mode === 'agent' && legs.some((l) => l.plan.routes.some((r) => !r.isAgentPick))
  const customCount = mode === 'agent'
    ? legs.reduce((n, l) => n + l.plan.routes.filter((r) => r.custom).length, 0)
    : 0
  const insight = useMemo(
    () => routingInsight({ campaign: c, enabled: flow.channels, mode, tuned }),
    [c, flow.channels, mode, tuned],
  )

  const dResponders = totals.responders - totals.agentResponders
  const dCost = totals.cost - totals.agentCost

  const open = building ? plan.routes.find((r) => r.key === building) : null

  const closeBuilder = () => setBuilding(null)
  const applyJourney = (steps) => { flow.setJourney(legKey(leg.id, building), steps); closeBuilder() }
  const applyToAll = (steps) => {
    flow.applyJourneyToAll(plan.routes.map((r) => legKey(leg.id, r.key)), steps)
    closeBuilder()
  }
  const resetJourney = () => { flow.clearJourney(legKey(leg.id, building)); closeBuilder() }

  /** Adopting a compared plan replaces this leg's routing and leaves the other alone. */
  const adoptPlan = ({ channels, routeOrders, journeys }) => {
    flow.applyPlan({
      channels,
      routeOrders: { ...dropLeg(flow.routeOrders, leg.id), ...legPrefix(routeOrders, leg.id) },
      journeys: { ...dropLeg(flow.journeys, leg.id), ...legPrefix(journeys, leg.id) },
    })
  }

  return (
    <div className={stepStyles.wrap}>
      <div>
        <div className={stepStyles.kicker}>Campaign design</div>
        <h1 className={`${stepStyles.h1} ${styles.h1}`}>{c.title}</h1>
        <div className={stepStyles.sub}>Everything here is yours to change.</div>
      </div>

      <div className={styles.body}>
      <div className={styles.trail}>
        <div className={styles.trailHead}>
          <span className={styles.trailKick}>Decision trail</span>
        </div>
        <ol className={styles.nodes}>
          {trailOf(c).map((n) => (
            <li key={n.id} className={styles.node}>
              <div className={styles.nodeHead}>
                <span className={styles.nodeKick}>{n.kind}</span>
                <span className={styles.nodeStep}>{n.step}</span>
              </div>
              <div className={styles.nodeVal}>{n.value}</div>
              <div className={styles.nodeNote}>{n.note}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.grid}>
        <div className={styles.work}>
          {/* ① WHO */}
          <section className={styles.sect}>
            <div className={styles.sectHead}>
              <span className={styles.sectNo}>1</span>
              <h2 className={styles.sectTitle}>Who receives it</h2>
              <div className={styles.sectMeta}>
                {fmtIN(c.reachable)} of {fmtIN(c.audience)} reachable
              </div>
            </div>

            {plans && (
              <div className={styles.planRow}>
                {PLANS.map((p) => {
                  const on = c.plan === p.id
                  const v = plans[p.id]
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`${styles.planChip} ${on ? styles.planChipOn : ''}`}
                      onClick={() => flow.pickPlan(p.id)}
                      aria-pressed={on}
                      title={p.note}
                    >
                      <span className={styles.planChipLabel}>{p.short}</span>
                      <span className={styles.planChipFig}>{fmtIN(v.targeted)}</span>
                      <span className={styles.planChipRoi}>{roi(v.roiX)}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className={styles.funnel}>
              <div className={styles.funnelRow}>
                <div className={styles.funnelLabel}>Qualified audience</div>
                <div className={styles.funnelFig}>{fmtIN(c.audience)}</div>
              </div>

              {legs.length > 1 && legs.map((l) => (
                <div key={l.id} className={`${styles.funnelLeg} ${styles[`leg_${l.kind}`]}`}>
                  <span className={styles.funnelLegName}>{l.label}</span>
                  <span className={styles.funnelLegNote}>{l.note}</span>
                  <span className={styles.funnelLegFig}>{fmtIN(l.audience)}</span>
                </div>
              ))}

              {legs[0].excl.rules.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`${styles.rule} ${flow.exclusions[e.id] ? '' : styles.ruleOff}`}
                  title={e.note}
                  onClick={() => flow.toggleExclusion(e.id)}
                  aria-pressed={!!flow.exclusions[e.id]}
                >
                  <span
                    className={`${styles.box} ${flow.exclusions[e.id] ? styles.boxOn : ''}`}
                    aria-hidden="true"
                  >
                    {flow.exclusions[e.id] ? '✓' : ''}
                  </span>
                  <span className={styles.ruleLabel}>
                    {e.label}
                    {e.required && <span className={styles.req}>required</span>}
                  </span>
                  <span
                    className={`${styles.ruleFig} ${flow.exclusions[e.id] ? styles.ruleFigOn : ''}`}
                  >
                    {flow.exclusions[e.id]
                      ? `−${fmtIN(Math.round(c.audience * e.rate))}`
                      : `+${fmtIN(Math.round(c.audience * e.rate))} back in`}
                  </span>
                </button>
              ))}

              <div className={`${styles.funnelRow} ${styles.funnelNet}`}>
                <div className={styles.funnelLabel}>Will be contacted</div>
                <div className={styles.funnelFig}>{fmtIN(c.reachable)}</div>
              </div>
            </div>

            {c.breaches.length > 0 && (
              <div className={styles.breach}>
                <b>{c.breaches[0].label}</b> is switched off. Sending to cardholders who
                withdrew consent breaches marketing policy and will fail the approval on step 06.
              </div>
            )}
          </section>

          {/* ② HOW */}
          <section className={styles.sect}>
            <div className={styles.sectHead}>
              <span className={styles.sectNo}>2</span>
              <h2 className={styles.sectTitle}>How it reaches them</h2>
              <div className={styles.sectMeta}>
                {totals.people > 0 && `${rupee(totals.cost)} contact cost`}
              </div>
            </div>

            <div className={`${styles.insight} ${styles[`ins_${insight.tone}`]}`}>
              <div className={styles.insightHead}>
                <SparkIcon className={styles.insightIcon} />
                <span className={styles.insightKick}>{insight.kicker}</span>
              </div>
              <div className={styles.insightTitle}>{insight.title}</div>
              <div className={styles.insightBody}>{insight.body}</div>
              {insight.action && (
                <button
                  type="button"
                  className={styles.insightAction}
                  onClick={() => flow.toggleChannel(insight.action.channel)}
                >
                  {insight.action.label} <span aria-hidden="true">→</span>
                </button>
              )}
            </div>

            <div className={styles.modes}>
              {ROUTE_MODES.map((m) => {
                const on = mode === m.id
                const v = byMode[m.id]
                const delta = byMode.fixed.totals.cost - byMode.agent.totals.cost
                const isCheap = delta !== 0 && ((m.id === 'agent') === (delta > 0))
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.mode} ${on ? styles.modeOn : ''}`}
                    onClick={() => flow.pickRouteMode(m.id)}
                    aria-pressed={on}
                  >
                    <span className={styles.modeTop}>
                      <span className={`${styles.radio} ${on ? styles.radioOn : ''}`} aria-hidden="true" />
                      <span className={styles.modeLabel}>{m.label}</span>
                      <span className={styles.modeBy}>{m.by}</span>
                    </span>
                    <span className={styles.modeNote}>{m.note}</span>
                    <span className={styles.modeFigs}>
                      <span className={styles.modeFig}>
                        <span className={styles.modeFigK}>Contact cost</span>
                        <span className={styles.modeFigV}>{rupee(v.totals.cost)}</span>
                      </span>
                      <span className={styles.modeFig}>
                        <span className={styles.modeFigK}>Respond</span>
                        <span className={styles.modeFigV}>{fmtIN(v.totals.responders)}</span>
                      </span>
                      {delta !== 0 && (
                        <span className={`${styles.modeTag} ${isCheap ? styles.modeTagWin : ''}`}>
                          {isCheap
                            ? `${rupee(Math.abs(delta))} cheaper`
                            : `${rupee(Math.abs(delta))} more`}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className={styles.lede}>
              {mode === 'agent' ? (
                <>
                  Every cardholder carries the channels they have actually responded to before.
                  People who answer the same set are grouped, and each group leads with the channel
                  that buys the most responses per rupee — so the premium channel is only paid for on
                  whoever is still open. That resolves to the {plan.routes.length}{' '}
                  {plan.routes.length === 1 ? 'group' : 'groups'} below.
                </>
              ) : (
                <>
                  Everyone gets the same touches in the same order, whatever they answer. A touch on a
                  channel a cardholder never responds to is still delivered and still billed — it just
                  barely converts, which is what the difference above is paying for.
                </>
              )}
            </p>

            <div className={styles.chnPicker}>
              <span className={styles.chnPickerK}>Channels in play</span>
              {CHANNELS.map((ch) => {
                const on = !!flow.channels[ch.id]
                return (
                  <button
                    key={ch.id}
                    type="button"
                    className={`${styles.chnChip} ${on ? styles.chnChipOn : ''}`}
                    onClick={() => flow.toggleChannel(ch.id)}
                    aria-pressed={on}
                    title={`${ch.hint} · ₹${ch.cost.toFixed(2)} per send · ${Math.round(ch.reachPct * 100)}% contactable`}
                  >
                    {ch.name}
                    <span className={styles.chnCost}>₹{ch.cost.toFixed(2)}</span>
                    <span className={styles.chnReach}>{Math.round(ch.reachPct * 100)}% contactable</span>
                  </button>
                )
              })}
              {tuned && (
                <button type="button" className={styles.reset} onClick={flow.resetRouteOrders}>
                  Reset to the agent&apos;s plan
                </button>
              )}
            </div>

            {picked.some((ch) => ch.capacity != null) && (
              <div className={styles.capNote}>
                {picked.filter((ch) => ch.capacity != null).map((ch) => (
                  <span key={ch.id}>
                    <b>{ch.name}</b> {fmtIN(ch.capacity)} calls available · {ch.capacityNote} ·
                    split across segments by size
                  </span>
                ))}
              </div>
            )}

            {picked.length === 0 ? (
              <div className={styles.warn}>
                Nothing will be sent. Switch on at least one channel to route the audience.
              </div>
            ) : (
              <>
                {legs.length > 1 && (
                  <div className={styles.legs} role="tablist" aria-label="Campaign legs">
                    {legs.map((l) => {
                      const on = l.id === leg.id
                      return (
                        <button
                          key={l.id}
                          type="button"
                          role="tab"
                          aria-selected={on}
                          className={`${styles.legTab} ${on ? styles.legTabOn : ''} ${styles[`leg_${l.kind}`]}`}
                          onClick={() => setLegTab(l.id)}
                        >
                          <span className={styles.legName}>{l.label}</span>
                          <span className={styles.legCount}>{fmtIN(l.plan.people)}</span>
                          <span className={styles.legNote}>{l.campaign.name}</span>
                          <span className={styles.legCost}>{rupee(l.plan.cost)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {mode === 'fixed' && (
                  <div className={styles.seqPick}>
                    <div className={styles.seqPickHead}>
                      <span className={styles.seqPickKick}>The sequence everyone gets</span>
                      {flow.fixedSeq.length > 0 && (
                        <button type="button" className={styles.link} onClick={flow.resetFixedSeq}>
                          Back to the default order
                        </button>
                      )}
                    </div>
                    <div className={styles.seqChips}>
                      {CHANNELS
                        .filter((ch) => flow.channels[ch.id])
                        .sort((a, b) => {
                          const ai = seq.indexOf(a.id)
                          const bi = seq.indexOf(b.id)
                          return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
                        })
                        .map((ch) => {
                          const at = seq.indexOf(ch.id)
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              className={`${styles.seqChip} ${at >= 0 ? styles.seqChipOn : ''}`}
                              onClick={() => flow.toggleFixedStep(ch.id)}
                              aria-pressed={at >= 0}
                              title={`₹${ch.cost.toFixed(2)} per send`}
                            >
                              <span className={styles.seqChipNo}>{at >= 0 ? at + 1 : '+'}</span>
                              {ch.name}
                              <span className={styles.seqChipCost}>₹{ch.cost.toFixed(2)}</span>
                            </button>
                          )
                        })}
                    </div>
                    <div className={styles.seqLine}>
                      {seq.length
                        ? seq.map((id) => CHANNELS.find((ch) => ch.id === id).name).join(' → ')
                        : 'No touches selected — nothing will be sent.'}
                    </div>
                  </div>
                )}

                <div className={styles.routes}>
                  {plan.routes.map((r) => (
                    <Route
                      key={r.key}
                      route={r}
                      fixed={mode === 'fixed'}
                      onCustomise={() => setBuilding(r.key)}
                      onPick={(opt) => flow.setRouteOrder(legKey(leg.id, r.key), opt)}
                      onDropJourney={() => flow.clearJourney(legKey(leg.id, r.key))}
                    />
                  ))}
                </div>

                <div className={styles.planFoot}>
                  <button type="button" className={styles.compare} onClick={() => setComparing(true)}>
                    Compare plans
                  </button>
                  <span>
                    <b>{fmtIN(totals.responders)}</b> of {fmtIN(totals.people)} expected to respond
                    {totals.responders > 0 && ` · ₹${(totals.cost / totals.responders).toFixed(2)} contact cost per responder`}
                    {totals.days > 0 && ` · finishes on day ${totals.days}`}
                  </span>
                  {tuned && (
                    <span className={styles.planDelta}>
                      <b className={dResponders >= 0 ? styles.pos : styles.neg}>
                        {dResponders >= 0 ? '+' : '−'}{fmtIN(Math.abs(dResponders))}
                      </b>{' '}
                      responders and{' '}
                      <b className={dCost <= 0 ? styles.pos : styles.neg}>
                        {dCost >= 0 ? '+' : '−'}{rupee(Math.abs(dCost))}
                      </b>{' '}
                      against the agent&apos;s plan
                    </span>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ③ WHEN */}
          <section className={styles.sect}>
            <div className={styles.sectHead}>
              <span className={styles.sectNo}>3</span>
              <h2 className={styles.sectTitle}>When it sends</h2>
              <div className={styles.sectMeta}>{c.sendWindow.label}</div>
            </div>

            <div className={styles.windows}>
              {SEND_WINDOWS.map((w) => {
                const on = flow.sendWindow === w.id
                return (
                  <button
                    key={w.id}
                    type="button"
                    className={`${styles.win} ${on ? styles.winOn : ''}`}
                    onClick={() => flow.pickSendWindow(w.id)}
                    aria-pressed={on}
                  >
                    <span className={styles.winLabel}>{w.label}</span>
                    <span className={styles.winNote}>{w.note}</span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── The consequence, held beside the controls that move it ── */}
        <aside className={styles.ledger}>
          <div className={styles.ledgerInner}>
            <div className={styles.ledgerKick}>What this runs to</div>

            <div className={styles.headline}>
              <div className={styles.headlineV}>
                {out.attritionFrom.toFixed(1)}% <span className={styles.arrow}>→</span>{' '}
                {out.attritionTo.toFixed(1)}%
              </div>
              <div className={styles.headlineNote}>90-day attrition after treatment</div>
            </div>

            <div className={styles.headline}>
              <div className={`${styles.headlineV} ${styles.brand}`}>{crore(out.profitCr)}</div>
              <div className={styles.headlineNote}>
                incremental profit at {roi(out.roiX)} return
              </div>
            </div>

            {legs.length > 1 && (
              <div className={styles.legSplit}>
                {legs.map((l) => (
                  <div key={l.id} className={`${styles.legSplitRow} ${styles[`leg_${l.kind}`]}`}>
                    <span className={styles.legSplitName}>{l.label}</span>
                    <span className={styles.legSplitFig}>{fmtIN(l.plan.people)}</span>
                    <span className={styles.legSplitCost}>{rupee(l.plan.cost)}</span>
                  </div>
                ))}
              </div>
            )}

            <dl className={styles.rows}>
              <div><dt>Contacted</dt><dd>{fmtIN(totals.people)}</dd></div>
              <div><dt>Expected to respond</dt><dd>{fmtIN(totals.responders)}</dd></div>
              <div><dt>Contact cost</dt><dd>{rupee(totals.cost)}</dd></div>
              <div><dt>Programme cost</dt><dd>{crore(out.investCr)}</dd></div>
              <div><dt>Held back as control</dt><dd>{fmtIN(c.control)}</dd></div>
            </dl>

            {plans && c.plan === 'paired' && (
              <div className={styles.ledgerSave}>
                {crore(plans.all.investCr - plans.paired.investCr)} less than paying every
                cardholder the incentive
              </div>
            )}

            {totals.capped > 0 && (
              <div className={styles.ledgerCap}>
                {fmtIN(totals.capped)} dropped where a capped channel ran out
              </div>
            )}

            {totals.responders === 0 ? (
              <div className={styles.ledgerWarn}>
                Nothing reaches anyone, so nothing is modelled. Switch a channel back on.
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      </div>

      <StepActions>
        <Button variant="secondary" onClick={flow.goBack}>← Interventions</Button>
        <div className={`${stepStyles.actionsRight} ${styles.actionsEnd}`}>
          {customCount > 0 && (
            <span className={styles.customTally}>
              {customCount} {customCount === 1 ? 'group' : 'groups'} on a journey you built
            </span>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={() => flow.goStep(4)}
            disabled={picked.length === 0}
            title={picked.length === 0 ? 'Switch on at least one channel first' : undefined}
          >
            Generate sample communication →
          </Button>
        </div>
      </StepActions>

      {comparing && (
        <ComparePlans
          cohort={leg.cohort}
          reachable={leg.reachable}
          channels={flow.channels}
          routeOrders={legMap(flow.routeOrders, leg.id)}
          journeys={legMap(flow.journeys, leg.id)}
          baseResponders={totals.agentResponders}
          profitCr={leg.econ.profitCr}
          investCr={leg.econ.investCr}
          onAdopt={adoptPlan}
          onClose={() => setComparing(false)}
        />
      )}

      {open && (
        <JourneyBuilder
          route={open}
          enabled={flow.channels}
          capsLeft={open.capsAllowed}
          segmentCount={plan.routes.length}
          onApply={applyJourney}
          onApplyAll={applyToAll}
          onReset={resetJourney}
          onClose={closeBuilder}
        />
      )}
    </div>
  )
}

/** One channel group: what it is, how the cascade runs, and how to change it. */
function Route({ route, fixed, onCustomise, onPick, onDropJourney }) {
  const peak = Math.max(1, ...route.steps.map((s) => s.contacted))
  const shortfall = route.steps.filter((s) => s.capped)
  // Touches landing on a channel this group does not answer — billed in full,
  // converting at a fraction. Only a fixed push produces them.
  const off = route.steps.filter((s) => s.offChannel)

  return (
    <div className={`${styles.route} ${route.custom ? styles.routeCustom : ''}`}>
      <div className={styles.routeTop}>
        <div className={styles.seq}>
          {route.steps.map((s, i) => (
            <span key={s.key} className={styles.seqPart}>
              {i > 0 && <span className={styles.seqArrow} aria-hidden="true">→</span>}
              <span className={`${styles.dot} ${styles[`ch_${s.id}`]}`} aria-hidden="true" />
              {s.name}
            </span>
          ))}
        </div>
        <div className={styles.routePeople}>
          <b>{fmtIN(route.people)}</b> people · {Math.round(route.share * 100)}%
        </div>
      </div>

      <div className={styles.answers}>
        Answers {route.ids.map((id) => CHANNELS.find((c) => c.id === id).name).join(' and ')}
        {fixed ? (
          off.length ? (
            <>
              {' '}— but is on your sequence, so{' '}
              <b className={styles.answersOff}>{off.map((s) => s.name).join(' and ')}</b>{' '}
              {off.length === 1 ? 'is a touch' : 'are touches'} this group does not answer.
            </>
          ) : ' — and your sequence happens to match what it answers.'
        ) : (
          <>
            {' '}— so it leads on {CHANNELS.find((c) => c.id === route.agentSeq[0]).name}, the
            cheapest response in that set.
          </>
        )}
      </div>

      <div className={styles.cascade}>
        {route.steps.map((s, i) => (
          <div key={s.key} className={styles.touch}>
            <span className={styles.touchNo}>{i + 1}</span>
            <span className={styles.touchName}>{s.name}</span>
            <span className={styles.touchDay}>day {s.day}</span>
            <span className={styles.touchTrack} aria-hidden="true">
              <span
                className={`${styles.touchSent} ${styles[`fill_${s.id}`]}`}
                style={{ width: `${(s.contacted / peak) * 100}%` }}
              />
              <span className={styles.touchOk} style={{ width: `${(s.responded / peak) * 100}%` }} />
            </span>
            <span className={styles.touchFig}>{fmtIN(s.contacted)} sent</span>
            <span className={styles.touchOkFig}>{fmtIN(s.responded)} respond</span>
            <span className={styles.touchRate}>{(s.rate * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {shortfall.length > 0 && (
        <div className={styles.routeCap}>
          {shortfall.map((st) => (
            <span key={st.key}>
              {st.name} ran out after {fmtIN(st.contacted)} · {fmtIN(st.short)} not reached
            </span>
          ))}
        </div>
      )}

      <div className={styles.routeFoot}>
        <div className={styles.routeResult}>
          <b>{fmtIN(route.responders)}</b> respond ({Math.round(route.rate * 100)}%) ·{' '}
          {rupee(route.cost)}
        </div>

        <div className={styles.routeCtl}>
          {fixed ? (
            <span className={styles.agentTag}>On your sequence</span>
          ) : route.custom ? (
            <>
              <span className={styles.customTag}>Your journey</span>
              <button type="button" className={styles.link} onClick={onDropJourney}>
                Hand back to the agent
              </button>
            </>
          ) : route.options.length < 2 ? (
            <span className={styles.agentTag}>Agent&apos;s sequence</span>
          ) : (
            route.options.map((opt) => {
              const on = opt.join() === route.seq.join()
              const isAgent = opt.join() === route.agentSeq.join()
              return (
                <button
                  key={opt.join()}
                  type="button"
                  className={`${styles.opt} ${on ? styles.optOn : ''}`}
                  onClick={() => onPick(opt)}
                  aria-pressed={on}
                  title={isAgent ? "The agent's pick" : undefined}
                >
                  {opt.map((id) => CHANNELS.find((c) => c.id === id).name).join(' → ')}
                  {isAgent && <span className={styles.star} aria-hidden="true">★</span>}
                </button>
              )
            })
          )}
          {!fixed && (
            <button type="button" className={styles.customise} onClick={onCustomise}>
              {route.custom ? 'Edit journey' : 'Build a journey'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
