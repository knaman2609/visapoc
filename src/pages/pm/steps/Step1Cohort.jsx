import { useState } from 'react'
import LineChart from '../../../components/charts/LineChart.jsx'
import Button from '../../../components/ui/Button.jsx'
import { PM_BENCH, PM_OBJECTIVES, PM_YEAR } from '../../../data/portfolio.js'
import stepStyles from './step.module.css'
import styles from './Step1Cohort.module.css'
import StepActions from '../StepActions.jsx'

const AXIS_FMT = {
  pct: (v) => `${v}%`,
  rupee: (v) => `₹${v}`,
  num: (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1)),
}

// The hero chart: the abnormality that raised the opportunity in the first place.
const ATTRITION_CHART = {
  label: '90-day attrition risk · last 12 months',
  max: 18,
  ticks: [6, 12, 18],
}

export default function Step1Cohort({ flow }) {
  // Null charts the monthly spend index; a benchmark id charts that metric instead.
  const [metricId, setMetricId] = useState(null)
  const metric = PM_BENCH.find((b) => b.id === metricId) || null
  // Collapsed by default — the hero chart and the objective cards lead; the
  // benchmark table is opened on demand to chart a different metric.
  const [benchOpen, setBenchOpen] = useState(false)

  return (
    <div className={stepStyles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.headKick}>Opportunity 01 · cohort analysis</div>
          <h1 className={styles.h1}>Affluent – Top-of-Wallet at risk of attrition</h1>
          <div className={styles.sub}>
            45,230 cardholders · ₹7,400 Cr micro-group PV · detected 04 Sep 04:12
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statK}>Micro-group PV</div>
          <div className={styles.statV}>₹7,400 Cr</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statK}>Attrition above peer benchmark</div>
          <div className={`${styles.statV} ${styles.statBad}`}>+5.7 pts</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statK}>Share of wallet</div>
          <div className={styles.statV}>38%</div>
        </div>
      </div>

      <div className={styles.chart}>
        {metric && (
          <button type="button" className={styles.chartBack} onClick={() => setMetricId(null)}>
            ← Back to 90-day attrition risk
          </button>
        )}

        <div key={metric ? metric.id : 'index'} className={styles.chartSwap}>
          {metric ? (
            <LineChart
              data={metric.series}
              label={`${metric.metric} · last 12 months`}
              max={metric.max}
              ticks={metric.ticks}
              fmt={AXIS_FMT[metric.format] || AXIS_FMT.num}
              showAxis
            />
          ) : (
            <LineChart
              data={PM_YEAR}
              label={ATTRITION_CHART.label}
              max={ATTRITION_CHART.max}
              ticks={ATTRITION_CHART.ticks}
              fmt={AXIS_FMT.pct}
              showAxis
            />
          )}
        </div>

        {metric && <div className={styles.chartRead}>{metric.read}</div>}

        <div className={styles.bench}>
          <button
            type="button"
            className={styles.benchHead}
            onClick={() => setBenchOpen((v) => !v)}
            aria-expanded={benchOpen}
            aria-controls="bench-table"
          >
            <span className={`${styles.benchChevron} ${benchOpen ? styles.benchChevronOpen : ''}`} aria-hidden="true">▸</span>
            Benchmark comparison
            <span className={styles.benchCount}>{PM_BENCH.length} metrics</span>
            <span className={styles.benchHint}>
              {benchOpen ? 'Pick a metric to chart its 12-month trend' : 'Show table'}
            </span>
          </button>

          <div id="bench-table" className={styles.benchCollapse} data-open={benchOpen ? 'true' : 'false'}>
            <div className={styles.benchCollapseInner}>
              <div className={styles.benchTable}>
                <div className={styles.benchHeadRow}>
                  <div>Metric</div><div>Cohort</div><div>Peer</div><div>Gap</div><div />
                </div>
                {PM_BENCH.map((b) => (
                  <button
                    key={b.metric}
                    type="button"
                    className={`${styles.benchRow} ${metricId === b.id ? styles.benchRowActive : ''}`}
                    onClick={() => setMetricId(metricId === b.id ? null : b.id)}
                    tabIndex={benchOpen ? 0 : -1}
                    title={`Chart the 12-month trend for ${b.metric.toLowerCase()}`}
                  >
                    <div className={styles.benchMetric}>{b.metric}</div>
                    <div className={styles.benchCohort}>{b.cohort}</div>
                    <div className={styles.benchPort}>{b.port}</div>
                    <div className={`${styles.benchDelta} ${b.bad ? '' : styles.benchDeltaOk}`}>{b.delta}</div>
                    <div className={styles.benchOpen}>{metricId === b.id ? '●' : '↗'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.objectives}>
        <div className={styles.objHead}>
          <div className={styles.objKick}>Set the objective</div>
          <div className={styles.objStatus}>THE AGENT PLANS AGAINST THIS</div>
        </div>
        <div className={styles.objGrid}>
          {PM_OBJECTIVES.map((o) => {
            const on = flow.objective === o.id
            return (
              <button
                key={o.id}
                type="button"
                className={`${styles.obj} ${on ? styles.objOn : ''}`}
                onClick={() => flow.pickObjective(o.id)}
              >
                <div className={styles.objTop}>
                  <div className={on ? styles.objMarkOn : styles.objMark}>{on ? '✓' : ''}</div>
                  <div className={styles.objLabel}>{o.label}</div>
                </div>
                <div className={styles.objGoal}>{o.goal}</div>
                <div className={styles.objConstraint}>{o.constraint}</div>
              </button>
            )
          })}
        </div>
      </div>

      <StepActions>
        <Button variant="secondary" onClick={flow.goBack}>← Overview</Button>
        <Button variant="secondary">Refine cohort rules</Button>
        <Button variant="primary" size="lg" className={stepStyles.actionsRight}
          disabled={!flow.objective}
          onClick={() => flow.goStep(2)}
        >
          Set the objective →
        </Button>
      </StepActions>
    </div>
  )
}
