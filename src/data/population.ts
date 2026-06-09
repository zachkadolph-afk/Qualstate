import { Claim, AgentAnswer, AnswerValue, Line } from './types'
import { ReviewType } from './forms'
import { FORM_SCOPES } from './forms'
import { QUESTIONNAIRES } from './questions'
import { Team, TEAMS } from './users'

/* ------------------------------------------------------------------ */
/*  Synthetic claim population — open and closed files. Closed claims  */
/*  feed the Diagnostic (outcome-based) pipeline; open claims feed the */
/*  Targeted (real-time) pipeline. Lightweight rows for sampling and   */
/*  cohort selection (not full review files).                          */
/* ------------------------------------------------------------------ */

export type ClaimStatusKind = 'Open' | 'Closed'

export interface PopClaim {
  id: string
  claimNumber: string
  line: Line
  peril: string
  segment: string
  state: string
  severity: 'Low' | 'Moderate' | 'High' | 'Severe'
  status: ClaimStatusKind
  reserve: number
  ageDays: number
  team: Team
  /** an AI-first-pass confidence stand-in, used for risk targeting */
  aiConfidence: number
  flags: string[]
}

export function reviewTypeForStatus(s: ClaimStatusKind): ReviewType {
  return s === 'Closed' ? 'Diagnostic' : 'Targeted'
}

const LINES: Line[] = ['Property', 'Auto', 'Casualty']
const SEGMENTS = ['Personal', 'Commercial']
const STATES = ['TX', 'CA', 'FL', 'OK', 'GA', 'IL', 'AZ', 'NC', 'PA', 'OH']
const SEVERITIES: PopClaim['severity'][] = ['Low', 'Moderate', 'High', 'Severe']
const RISK_FLAGS = ['Large loss', 'Litigation', 'Reserve change', 'SIU referral', 'Cat event', 'Rep complaint']

const TEAM_FOR_LINE: Record<Line, Team[]> = {
  Property: ['Property — West', 'Property — East', 'Complex & Litigation'],
  Auto: ['Auto — National', 'Complex & Litigation'],
  Casualty: ['Casualty — GL', 'Complex & Litigation'],
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Build a deterministic population of `n` claims (~55% closed, ~45% open). */
export function buildPopulation(n = 480): PopClaim[] {
  const rnd = mulberry32(909090)
  const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]
  const out: PopClaim[] = []
  for (let i = 0; i < n; i++) {
    const line = pick(LINES)
    const status: ClaimStatusKind = rnd() < 0.55 ? 'Closed' : 'Open'
    const severity = pick(SEVERITIES)
    const teamPool = TEAM_FOR_LINE[line]
    // severe/high skew toward Complex & Litigation
    const team = (severity === 'Severe' || (severity === 'High' && rnd() < 0.4)) && rnd() < 0.6 ? 'Complex & Litigation' : pick(teamPool)
    const flags: string[] = []
    if (rnd() < 0.16) flags.push(pick(RISK_FLAGS))
    if (rnd() < 0.06) flags.push(pick(RISK_FLAGS))
    out.push({
      id: `pop_${i}`,
      claimNumber: `${line.slice(0, 2).toUpperCase()}-2026-${10000 + i}`,
      line,
      peril: pick(FORM_SCOPES[line]),
      segment: pick(SEGMENTS),
      state: pick(STATES),
      severity,
      status,
      reserve: Math.round((3000 + rnd() * 120000) / 100) * 100,
      ageDays: status === 'Open' ? Math.floor(rnd() * 90) : Math.floor(rnd() * 400) + 30,
      team: team as Team,
      aiConfidence: Math.round((0.55 + rnd() * 0.43) * 100) / 100,
      flags: Array.from(new Set(flags)),
    })
  }
  return out
}

export const POPULATION: PopClaim[] = buildPopulation()

export const TEAM_LIST = TEAMS

/* ------------------------------------------------------------------ */
/*  Turn a population row into a reviewable Claim (synthetic AI pass)   */
/*  so open/targeted files can be opened and reviewed end-to-end.      */
/* ------------------------------------------------------------------ */

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function popClaimToClaim(p: PopClaim): Claim {
  const rnd = mulberry32(hashStr(p.id))
  const agentAnswers: AgentAnswer[] = QUESTIONNAIRES[p.line].map((q) => {
    const r = rnd()
    const value: AnswerValue = r < 0.7 ? 'yes' : r < 0.92 ? 'no' : 'na'
    return { questionId: q.id, value, confidence: Math.round((0.6 + rnd() * 0.38) * 100) / 100, rationale: '', evidence: [] }
  })
  const closed = p.status === 'Closed'
  const dol = new Date(2026, 5, 9)
  dol.setDate(dol.getDate() - p.ageDays - 10)
  const dc = new Date(2026, 5, 9)
  dc.setDate(dc.getDate() - Math.max(0, p.ageDays - 5))
  return {
    id: p.id,
    claimNumber: p.claimNumber,
    policyNumber: `POL-${p.id}`,
    line: p.line,
    perilType: p.peril,
    status: closed ? 'Completed' : 'Ready for Review',
    dateOfLoss: dol.toISOString().slice(0, 10),
    dateClosed: closed ? dc.toISOString().slice(0, 10) : '—',
    insured: 'Policyholder',
    adjuster: 'Assigned Adjuster',
    state: p.state,
    reserveAmount: p.reserve,
    paidAmount: closed ? Math.round((p.reserve * 0.7) / 100) * 100 : 0,
    severity: p.severity,
    summary: `${p.segment} ${p.line} — ${p.peril} (${p.status.toLowerCase()}). ${p.flags.length ? 'Risk flags: ' + p.flags.join(', ') + '.' : ''}`,
    facts: [
      { label: 'Status', value: p.status },
      { label: 'Peril', value: p.peril },
      { label: 'Segment', value: p.segment },
      { label: 'Reserve', value: `$${p.reserve.toLocaleString()}` },
    ],
    timeline: [],
    parties: [],
    agentAnswers,
  }
}

/** all population rows resolved to reviewable claims, keyed by id */
export const POP_CLAIMS: Record<string, Claim> = Object.fromEntries(POPULATION.map((p) => [p.id, popClaimToClaim(p)]))
