import { useCallback, useState } from 'react'
import { crore, iterate, roi } from '../data/cohorts.js'
import { fmtIN } from '../data/portfolio.js'

/**
 * Stand-in for the model call that would read the operator's request and set
 * the levers. Rules are applied in order and merged, so "high value customers
 * who are about to leave, spend less" moves all three levers in one turn.
 *
 * Swap `readIntent` for a real completion when the endpoint exists — the rest
 * of the loop (pending state, transcript, applying the patch) is unchanged.
 */
const RULES = [
  { re: /\b(reset|start over|baseline|default|undo)\b/,
    patch: { riskBand: 'all', profitBand: 'all', incentive: 1, depth: 1 },
    say: 'Reset every lever to the baseline' },

  { re: /\b(everyone|all of them|whole cohort|entire cohort|widen|broaden|open it up|no filters?|unfilter)\b/,
    patch: { riskBand: 'all', profitBand: 'all', depth: 1 },
    say: 'Opened the audience back up to the whole cohort' },

  { re: /\b(high[- ]?value|most valuable|profitable|high[- ]?profit|top spenders?|premium|best customers?|worth the most|biggest spenders?)\b/,
    patch: { profitBand: 'high' },
    say: 'Kept only the high-profit cardholders' },

  { re: /\b(low[- ]?value|least valuable|low[- ]?profit|small spenders?)\b/,
    patch: { profitBand: 'low' },
    say: 'Narrowed to the low-value cardholders' },

  { re: /\b(mid[- ]?value|middle|mid[- ]?profit|average value)\b/,
    patch: { profitBand: 'mid' },
    say: 'Narrowed to the mid-value band' },

  { re: /\b(high[- ]?risk|most likely to leave|about to leave|churn|churning|attriting|at risk|urgent|leaving|worst)\b/,
    patch: { riskBand: 'high' },
    say: 'Kept only the highest attrition risk' },

  { re: /\b(low[- ]?risk|stable|safe|not going anywhere|healthy)\b/,
    patch: { riskBand: 'low' },
    say: 'Narrowed to the low-risk cardholders' },

  { re: /\b(watch|borderline|middling risk)\b/,
    patch: { riskBand: 'watch' },
    say: 'Narrowed to the watch band' },

  { re: /\b(max(imise|imize)?\s+(the\s+)?roi|best return|most efficient|efficien\w*|best roi|highest roi)\b/,
    patch: { riskBand: 'high', profitBand: 'high', incentive: 0.7, depth: 0.6 },
    say: 'Went for efficiency — tightest audience on a leaner incentive' },

  { re: /\b(max(imise|imize)?\s+(the\s+)?profit|biggest profit|most profit|highest profit|as much profit)\b/,
    patch: { riskBand: 'all', profitBand: 'all', incentive: 1.3, depth: 1 },
    say: 'Went for absolute profit — full audience on a richer incentive' },
]

const CHEAPER = /\b(spend less|cheaper|leaner|cut (the )?(cost|spend|budget)|reduce the incentive|smaller (offer|incentive)|less generous|tighten the budget|save money)\b/
const RICHER = /\b(spend more|richer|bigger (offer|incentive)|more generous|raise the incentive|be aggressive|go harder|sweeten)\b/
const EXPLICIT = /(\d(?:\.\d)?)\s*(?:x|×)/

const TOP_PCT = /\b(?:top|best|strongest)\s+(\d{1,3})\s*%/
const NARROWER = /\b(fewer|smaller audience|narrow(?:er)? (?:the )?audience|target fewer|tighten the audience|trim the audience|shorter list)\b/
const WIDER = /\b(more people|wider audience|reach more|widen the audience|longer list|bigger audience)\b/

const clamp = (n) => Math.min(2, Math.max(0.5, Math.round(n * 10) / 10))
const clampDepth = (n) => Math.min(1, Math.max(0.05, Math.round(n * 20) / 20))

export function readIntent(text, current) {
  const t = text.toLowerCase()
  const patch = {}
  const said = []

  for (const r of RULES) {
    if (r.re.test(t)) {
      Object.assign(patch, r.patch)
      said.push(r.say)
    }
  }

  const explicit = t.match(EXPLICIT)
  if (explicit) {
    patch.incentive = clamp(Number(explicit[1]))
    said.push(`Set the incentive to ${patch.incentive.toFixed(1)}× base`)
  } else if (CHEAPER.test(t)) {
    patch.incentive = clamp((patch.incentive ?? current.incentive) - 0.3)
    said.push(`Trimmed the incentive to ${patch.incentive.toFixed(1)}× base`)
  } else if (RICHER.test(t)) {
    patch.incentive = clamp((patch.incentive ?? current.incentive) + 0.3)
    said.push(`Raised the incentive to ${patch.incentive.toFixed(1)}× base`)
  }

  const top = t.match(TOP_PCT)
  if (top) {
    patch.depth = clampDepth(Number(top[1]) / 100)
    said.push(`Kept the strongest ${Math.round(patch.depth * 100)}% of them`)
  } else if (NARROWER.test(t)) {
    patch.depth = clampDepth((patch.depth ?? current.depth ?? 1) - 0.25)
    said.push(`Trimmed the audience to the strongest ${Math.round(patch.depth * 100)}%`)
  } else if (WIDER.test(t)) {
    patch.depth = clampDepth((patch.depth ?? current.depth ?? 1) + 0.25)
    said.push(`Widened the audience to the top ${Math.round(patch.depth * 100)}%`)
  }

  if (!said.length) return { patch: null, say: null }
  return { patch, say: joinClauses(said) }
}

function joinClauses(parts) {
  if (parts.length === 1) return parts[0]
  // Only the opening clause keeps its capital.
  const [first, ...rest] = parts
  const tail = rest.map((p) => p.replace(/^([A-Z])/, (c) => c.toLowerCase()))
  return `${[first, ...tail.slice(0, -1)].join(', ')}, and ${tail[tail.length - 1]}`
}

const MISS = 'I could not tell which lever you meant. Try “only the high-value cardholders”, ' +
  '“the ones most likely to leave”, “spend less per head”, “the top 40%”, or “1.4×”.'

export function useIterateAgent(offer, cohort, opts, setOpts) {
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)

  const ask = useCallback((text) => {
    const q = text.trim()
    if (!q || pending) return

    setMessages((m) => [...m, { role: 'user', text: q }])
    setPending(true)

    // A beat of latency so the levers are visibly moved by the agent, not the click.
    setTimeout(() => {
      const { patch, say } = readIntent(q, opts)

      if (!patch) {
        setMessages((m) => [...m, { role: 'agent', text: MISS, miss: true }])
        setPending(false)
        return
      }

      const next = { ...opts, ...patch }
      setOpts(next)

      const r = iterate(offer, cohort, next)
      const outcome = r.empty
        ? 'That leaves nobody in the sample, though — widen one of the filters.'
        : `Now ${fmtIN(r.targeted)} cardholders · ${crore(r.profitCr)} profit on ${crore(r.investCr)} at ${roi(r.roiX)}.`

      setMessages((m) => [...m, { role: 'agent', text: `${say}. ${outcome}` }])
      setPending(false)
    }, 620)
  }, [offer, cohort, opts, setOpts, pending])

  const reset = useCallback(() => setMessages([]), [])

  return { messages, pending, ask, reset }
}
