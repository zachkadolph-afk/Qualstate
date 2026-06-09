/**
 * Standalone verification of the reviewer agree/disagree flow.
 * Bundled + run with esbuild+node (see npm run test:review) so it exercises
 * the REAL scoring + data, not a re-implementation.
 */
import { REVIEW_CLAIMS } from '../src/data/claims'
import { QUESTIONNAIRES, ANSWER_POINTS } from '../src/data/questions'
import { computeReview, scoreAnswers, effectiveValue } from '../src/lib/scoring'
import { AnswerValue, ReviewerAnswer } from '../src/data/types'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  const tag = cond ? '  [32mPASS[0m' : '  [31mFAIL[0m'
  console.log(`${tag}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!cond) failures++
}

console.log('\n=== Data integrity ===')
check(`>= 10 claims ready for review`, REVIEW_CLAIMS.length >= 10, `found ${REVIEW_CLAIMS.length}`)
check('all claim ids unique', new Set(REVIEW_CLAIMS.map((c) => c.id)).size === REVIEW_CLAIMS.length)
for (const c of REVIEW_CLAIMS) {
  const qids = QUESTIONNAIRES[c.line].map((q) => q.id)
  const answered = new Set(c.agentAnswers.map((a) => a.questionId))
  const covers = qids.every((id) => answered.has(id))
  check(`${c.claimNumber} has an agent answer for all ${qids.length} questions`, covers)
}

console.log('\n=== Reviewer AGREES with every finding ===')
{
  const claim = REVIEW_CLAIMS[0]
  const answers: Record<string, ReviewerAnswer> = {}
  for (const a of claim.agentAnswers) answers[a.questionId] = { questionId: a.questionId, decision: 'agree' }
  const r = computeReview(claim, answers)
  check('all-agree calibration is 100%', r.calibration === 100, `${r.calibration}%`)
  check('quality score equals AI-only score when fully agreed', r.qualityScore === r.agentScore, `${r.qualityScore} vs ${r.agentScore}`)
  check('agreement count equals question count', r.agreements === claim.agentAnswers.length)
  check('zero disagreements', r.disagreements === 0)
}

console.log('\n=== Reviewer DISAGREES and corrects a finding ===')
{
  // Use the property fire claim; flip a "yes" finding to "no" and confirm the
  // validated score drops below the AI-only score and calibration falls.
  const claim = REVIEW_CLAIMS.find((c) => c.id === 'CLM-PR-6203')!
  const target = claim.agentAnswers.find((a) => a.value === 'yes')!
  const answers: Record<string, ReviewerAnswer> = {}
  for (const a of claim.agentAnswers) answers[a.questionId] = { questionId: a.questionId, decision: 'agree' }
  answers[target.questionId] = {
    questionId: target.questionId,
    decision: 'disagree',
    correctedValue: 'no',
    note: 'Reviewer override for test',
  }
  const r = computeReview(claim, answers)
  check('effectiveValue reflects the correction', effectiveValue(target, answers[target.questionId]) === 'no')
  check('one disagreement recorded', r.disagreements === 1, `${r.disagreements}`)
  check('validated score is below AI-only score after downgrading a finding', r.qualityScore < r.agentScore, `${r.qualityScore} < ${r.agentScore}`)
  const expectedCal = Math.round(((claim.agentAnswers.length - 1) / claim.agentAnswers.length) * 100)
  check('calibration drops by exactly one corrected answer', r.calibration === expectedCal, `${r.calibration}% expected ${expectedCal}%`)
}

console.log('\n=== Disagreeing UP (no -> yes) raises the validated score ===')
{
  const claim = REVIEW_CLAIMS.find((c) => c.agentAnswers.some((a) => a.value === 'no'))!
  const target = claim.agentAnswers.find((a) => a.value === 'no')!
  const answers: Record<string, ReviewerAnswer> = {}
  for (const a of claim.agentAnswers) answers[a.questionId] = { questionId: a.questionId, decision: 'agree' }
  const agentScore = computeReview(claim, answers).agentScore
  answers[target.questionId] = { questionId: target.questionId, decision: 'disagree', correctedValue: 'yes' }
  const r = computeReview(claim, answers)
  check(`${claim.claimNumber}: upgrading a "Not Met" to "Met" raises validated score`, r.qualityScore > agentScore, `${r.qualityScore} > ${agentScore}`)
}

console.log('\n=== N/A answers are excluded from the denominator ===')
{
  const claim = REVIEW_CLAIMS.find((c) => c.agentAnswers.some((a) => a.value === 'na'))!
  const allYes: Record<string, AnswerValue> = {}
  for (const a of claim.agentAnswers) allYes[a.questionId] = 'yes'
  // a pure-yes file (minus the na exclusion) should score 100
  const withNa = { ...allYes }
  const naId = claim.agentAnswers.find((a) => a.value === 'na')!.questionId
  withNa[naId] = 'na'
  check('all-yes (with an N/A excluded) scores 100', scoreAnswers(claim, withNa) === 100, `${scoreAnswers(claim, withNa)}`)
  check('ANSWER_POINTS sanity (yes=1, partial=0.5, no=0)', ANSWER_POINTS.yes === 1 && ANSWER_POINTS.partial === 0.5 && ANSWER_POINTS.no === 0)
}

console.log(`\n${failures === 0 ? '[32mAll checks passed[0m' : `[31m${failures} check(s) failed[0m`}\n`)
process.exit(failures === 0 ? 0 : 1)
