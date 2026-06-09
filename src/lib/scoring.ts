import { ANSWER_POINTS } from '../data/questions'
import { AgentAnswer, AnswerValue, Claim, ReviewerAnswer } from '../data/types'
import { QUESTIONNAIRES } from '../data/questions'

/** weighted score 0-100 from a set of answer values keyed by questionId */
export function scoreAnswers(claim: Claim, values: Record<string, AnswerValue>): number {
  const questions = QUESTIONNAIRES[claim.line]
  let earned = 0
  let possible = 0
  for (const q of questions) {
    const v = values[q.id]
    if (!v || v === 'na') continue
    possible += q.weight
    earned += q.weight * ANSWER_POINTS[v]
  }
  if (possible === 0) return 0
  return Math.round((earned / possible) * 100)
}

/** the reviewer's own answer stands alone; fall back to the agent if unanswered */
export function effectiveValue(agent: AgentAnswer, reviewer?: ReviewerAnswer): AnswerValue {
  return reviewer?.value ?? agent.value
}

/** the reviewer agrees when their independent answer matches the agent's */
export function reviewerAgreed(agentValue: AnswerValue, reviewer?: ReviewerAnswer): boolean {
  return reviewer?.value != null && reviewer.value === agentValue
}

export interface ReviewResult {
  qualityScore: number // reviewer's validated score
  agentScore: number // what the AI alone would have scored
  calibration: number // % of questions the reviewer agreed with the AI
  agreements: number
  disagreements: number
  scored: number
}

export function computeReview(
  claim: Claim,
  reviewerAnswers: Record<string, ReviewerAnswer>,
): ReviewResult {
  const agentValues: Record<string, AnswerValue> = {}
  const finalValues: Record<string, AnswerValue> = {}
  let agreements = 0
  let disagreements = 0
  let scored = 0

  for (const a of claim.agentAnswers) {
    const r = reviewerAnswers[a.questionId]
    agentValues[a.questionId] = a.value
    finalValues[a.questionId] = effectiveValue(a, r)
    if (r?.value != null) {
      scored++
      if (r.value === a.value) agreements++
      else disagreements++
    }
  }

  const calibration = scored === 0 ? 0 : Math.round((agreements / scored) * 100)

  return {
    qualityScore: scoreAnswers(claim, finalValues),
    agentScore: scoreAnswers(claim, agentValues),
    calibration,
    agreements,
    disagreements,
    scored,
  }
}

export function scoreBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Excellent', color: '#15803d', bg: '#dcfce7' }
  if (score >= 80) return { label: 'Meets Standard', color: '#1c4fe0', bg: '#dbeafe' }
  if (score >= 70) return { label: 'Needs Attention', color: '#b45309', bg: '#fef3c7' }
  return { label: 'Below Standard', color: '#b91c1c', bg: '#fee2e2' }
}

export function currency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
