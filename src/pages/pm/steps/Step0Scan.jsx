import { BOOK } from '../../../data/book.js'
import { LIVE_TOTALS } from '../../../data/campaigns.js'
import { PM_OPPS } from '../../../data/portfolio.js'
import Button from '../../../components/ui/Button.jsx'
import Chip from '../../../components/ui/Chip.jsx'
import styles from './Step0Scan.module.css'

const inr = (n) => n.toLocaleString('en-IN')

/**
 * Step one of the flow: the book in five numbers, and the one opportunity the
 * operator came in on.
 *
 * Deliberately thin. Taking the book apart happens on the deep-dive page and
 * the running commentary lives on the assistant — a step whose job is "here is
 * the thing you are about to work on" earns nothing by carrying either.
 */
export default function Step0Scan({ flow }) {
  const opp = PM_OPPS.find((o) => o.id === flow.pmOpp) || PM_OPPS[0]

  // Committed is what the live campaigns have actually spent, so this tile and
  // the campaigns register can never quote different numbers.
  const committed = (LIVE_TOTALS.spentCr / BOOK.budgetCr) * 100

  return (
    <>
      <div className={styles.kpis}>
        <Kpi k="Payment volume" v={`₹${inr(BOOK.pvCr)} Cr`} note={`+${BOOK.pvYoY}% YoY`} up />
        <Kpi
          k="Active cardholders"
          v={`${(BOOK.activeK / 1000).toFixed(2)}M`}
          note={`${BOOK.activeRate}% of ${(BOOK.cardsK / 1000).toFixed(2)}M issued`}
        />
        <Kpi
          k="90-day attrition" v={`${BOOK.attrition}%`}
          note={`+${(BOOK.attrition - BOOK.peerAttrition).toFixed(1)} pts vs peer ${BOOK.peerAttrition}%`}
          bad
        />
        <Kpi k="Avg. revolve rate" v={`${BOOK.revolve}%`} note="stable vs last year" />
        <div className={styles.kpi}>
          <div className={styles.kpiK}>Retention budget</div>
          <div className={styles.kpiV}>₹{LIVE_TOTALS.spentCr.toFixed(2)} Cr</div>
          <div className={styles.meter} title={`${committed.toFixed(0)}% committed`}>
            <span className={styles.meterFill} style={{ width: `${committed}%` }} />
          </div>
          <div className={styles.kpiNote}>
            {committed.toFixed(0)}% of ₹{BOOK.budgetCr} Cr · ₹{LIVE_TOTALS.budgetCr.toFixed(2)} Cr
            approved across {LIVE_TOTALS.count} campaigns
          </div>
        </div>
      </div>

      <div className={styles.mainHead}>
        <div>
          <h1 className={styles.mainH1}>Opportunity detected</h1>
          <div className={styles.mainSub}>
            Raised by the overnight sweep and still open, with the cost and the return of the
            campaign it would become.
          </div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.rowHead}>
          <div>Opportunity</div>
          <div className={styles.num}>Customers</div>
          <div>Evidence</div>
          <div className={styles.num}>Campaign cost</div>
          <div className={styles.num}>Expected return</div>
          <div>Impact</div>
          <div />
        </div>

        <div className={`${styles.row} ${styles.rowActive}`}>
          <div>
            <div className={styles.title}>{opp.title}</div>
            <div className={styles.conf}>{opp.conf}</div>
          </div>
          <div className={styles.cust}>{opp.cust}</div>
          <div className={styles.chips}>
            {opp.chips.map((c) => <Chip key={c}>{c}</Chip>)}
          </div>
          <div className={styles.cost}>
            <div className={styles.costV}>₹{opp.costCr.toFixed(2)} Cr</div>
            <div className={styles.costK}>modelled spend</div>
          </div>
          <div className={styles.cost}>
            <div className={styles.roiV}>{opp.roiX.toFixed(1)}×</div>
            <div className={styles.costK}>₹{(opp.costCr * opp.roiX).toFixed(2)} Cr profit</div>
          </div>
          <div>
            <div className={styles.impact}>{opp.impact}</div>
            <div className={styles.impactNote}>{opp.note}</div>
          </div>
          <div>
            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => { flow.pickOpp(opp.id); flow.goStep(1) }}
            >
              Analyse cohort →
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function Kpi({ k, v, note, up, bad }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiK}>{k}</div>
      <div className={styles.kpiV}>{v}</div>
      <div className={`${styles.kpiNote} ${up ? styles.kpiUp : ''} ${bad ? styles.kpiBad : ''}`}>
        {note}
      </div>
    </div>
  )
}
