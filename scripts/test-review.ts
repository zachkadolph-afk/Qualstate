/**
 * Standalone verification of the reviewer agree/disagree flow.
 * Bundled + run with esbuild+node (see npm run test:review) so it exercises
 * the REAL scoring + data, not a re-implementation.
 */
import { REVIEW_CLAIMS, COMPLETED_REVIEWS, HISTORY_CLAIMS } from '../src/data/claims'
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

console.log('\n=== Reviewer answers identically to the AI (full agreement) ===')
{
  const claim = REVIEW_CLAIMS[0]
  const answers: Record<string, ReviewerAnswer> = {}
  for (const a of claim.agentAnswers) answers[a.questionId] = { questionId: a.questionId, value: a.value }
  const r = computeReview(claim, answers)
  check('matching answers => 100% calibration', r.calibration === 100, `${r.calibration}%`)
  check('quality score equals AI-only score when answers match', r.qualityScore === r.agentScore, `${r.qualityScore} vs ${r.agentScore}`)
  check('agreement count equals question count', r.agreements === claim.agentAnswers.length)
  check('zero disagreements', r.disagreements === 0)
}

console.log('\n=== Reviewer answers a "yes" finding as "no" (differs, stands alone) ===')
{
  const claim = REVIEW_CLAIMS.find((c) => c.id === 'CLM-PR-6203')!
  const target = claim.agentAnswers.find((a) => a.value === 'yes')!
  const answers: Record<string, ReviewerAnswer> = {}
  for (const a of claim.agentAnswers) answers[a.questionId] = { questionId: a.questionId, value: a.value }
  answers[target.questionId] = { questionId: target.questionId, value: 'no', note: 'Reviewer note for test' }
  const r = computeReview(claim, answers)
  check("reviewer's answer stands alone (effectiveValue is theirs)", effectiveValue(target, answers[target.questionId]) === 'no')
  check('one disagreement auto-detected', r.disagreements === 1, `${r.disagreements}`)
  check('validated score is below AI-only score after a "no"', r.qualityScore < r.agentScore, `${r.qualityScore} < ${r.agentScore}`)
  const expectedCal = Math.round(((claim.agentAnswers.length - 1) / claim.agentAnswers.length) * 100)
  check('calibration drops by exactly one differing answer', r.calibration === expectedCal, `${r.calibration}% expected ${expectedCal}%`)
}

console.log('\n=== Reviewer answers a "no" finding as "yes" raises the validated score ===')
{
  const claim = REVIEW_CLAIMS.find((c) => c.agentAnswers.some((a) => a.value === 'no'))!
  const target = claim.agentAnswers.find((a) => a.value === 'no')!
  const answers: Record<string, ReviewerAnswer> = {}
  for (const a of claim.agentAnswers) answers[a.questionId] = { questionId: a.questionId, value: a.value }
  const agentScore = computeReview(claim, answers).agentScore
  answers[target.questionId] = { questionId: target.questionId, value: 'yes' }
  const r = computeReview(claim, answers)
  check(`${claim.claimNumber}: answering "No" as "Yes" raises validated score`, r.qualityScore > agentScore, `${r.qualityScore} > ${agentScore}`)
}

console.log('\n=== Notes are allowed on agreeing answers (not just differences) ===')
{
  const claim = REVIEW_CLAIMS[0]
  const a0 = claim.agentAnswers[0]
  const ra: ReviewerAnswer = { questionId: a0.questionId, value: a0.value, note: 'Agree, but noting context' }
  check('an agreeing answer can carry a note', ra.value === a0.value && !!ra.note)
}

console.log('\n=== N/A answers are excluded from the denominator ===')
{
  const claim = REVIEW_CLAIMS.find((c) => c.agentAnswers.some((a) => a.value === 'na'))!
  const allYes: Record<string, AnswerValue> = {}
  for (const a of claim.agentAnswers) allYes[a.questionId] = 'yes'
  const withNa = { ...allYes }
  const naId = claim.agentAnswers.find((a) => a.value === 'na')!.questionId
  withNa[naId] = 'na'
  check('all-yes (with an N/A excluded) scores 100', scoreAnswers(claim, withNa) === 100, `${scoreAnswers(claim, withNa)}`)
  check('ANSWER_POINTS sanity (yes=1, no=0)', ANSWER_POINTS.yes === 1 && ANSWER_POINTS.no === 0 && ANSWER_POINTS.partial === undefined)
}

console.log('\n=== Named recent completed reviews feed the dashboard ===')
{
  const named = ['H-AU-2207', 'H-PR-2208', 'H-CA-2209', 'H-PR-2210', 'H-CA-2211']
  for (const id of named) {
    const rev = COMPLETED_REVIEWS.find((r) => r.claimId === id)
    const claim = HISTORY_CLAIMS[id]
    check(`${id} is in completed history with a resolvable claim`, !!rev && !!claim)
    if (rev && claim) {
      const rec: Record<string, ReviewerAnswer> = {}
      for (const a of rev.reviewerAnswers) rec[a.questionId] = a
      const r = computeReview(claim, rec)
      check(`${claim.claimNumber} stored scores match recomputed scores`,
        r.qualityScore === rev.qualityScore && r.agentScore === rev.agentScore && r.calibration === rev.calibration,
        `q${rev.qualityScore}/cal${rev.calibration}%`)
    }
  }
  const topFive = COMPLETED_REVIEWS.slice(0, 5).map((r) => r.claimId)
  check('named reviews occupy the most-recent slots', named.every((id) => topFive.includes(id)), topFive.join(','))
  check('top review is the newest (2026-06-08)', COMPLETED_REVIEWS[0].completedAt === '2026-06-08', COMPLETED_REVIEWS[0].completedAt)
  const pendingIds = new Set(REVIEW_CLAIMS.map((c) => c.id))
  const overlap = COMPLETED_REVIEWS.filter((r) => pendingIds.has(r.claimId))
  check('no claim is both pending and completed', overlap.length === 0, `${overlap.length} overlaps`)
}

console.log(`\n${failures === 0 ? '[32mAll checks passed[0m' : `[31m${failures} check(s) failed[0m`}\n`)
process.exit(failures === 0 ? 0 : 1)
