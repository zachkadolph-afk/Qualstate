import { Line, Question } from './types'
import { QUESTIONNAIRES } from './questions'

/* ------------------------------------------------------------------ */
/*  Review forms — the questionnaire library. Each form is tied to a   */
/*  line of business and a scope/segment/tier, and owns its own copy   */
/*  of the question set. Owned by the store so every module shares it. */
/* ------------------------------------------------------------------ */

export type FormStatus = 'Published' | 'Draft' | 'Archived'

/**
 * Two review modes:
 *  - Diagnostic: outcome-based, retrospective review of settled/closed claims.
 *  - Targeted:   real-time review of open, in-flight claims aimed at specific risks.
 */
export type ReviewType = 'Diagnostic' | 'Targeted'

export const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  Diagnostic: 'Outcome-based',
  Targeted: 'Real-time',
}
export const REVIEW_TYPE_SUB: Record<ReviewType, string> = {
  Diagnostic: 'Retrospective review of settled claims',
  Targeted: 'In-flight review of open claims',
}

export interface ReviewForm {
  id: string
  name: string
  line: Line
  scope: string
  segment: string
  reviewType: ReviewType
  status: FormStatus
  version: number
  updated: string
  questions: Question[]
}

export const FORM_LINES: Line[] = ['Property', 'Auto', 'Casualty']
export const FORM_SEGMENTS = ['Personal', 'Commercial']
export const FORM_TIERS = ['Express', 'Standard', 'Complex', 'Litigated']

export const FORM_SCOPES: Record<Line, string[]> = {
  Property: ['Water Damage', 'Wind/Hail', 'Fire', 'Theft', 'Freeze', 'Flood', 'Lightning', 'Mold', 'Vandalism', 'Roof', 'Sewer Backup', 'Smoke'],
  Auto: ['Collision', 'Comprehensive', 'Total Loss', 'Glass', 'Rear-End', 'Theft', 'Vandalism', 'Rental', 'UM/UIM', 'PIP', 'Hail', 'Towing'],
  Casualty: ['Slip & Fall', 'Dog Bite', 'Premises', 'Bodily Injury', 'Product', 'Medical Payments', 'Assault', 'Auto Liability', 'Construction Defect', 'Libel'],
}

// deterministic PRNG so the library is stable across reloads/seeds
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function cloneSpine(line: Line): Question[] {
  return JSON.parse(JSON.stringify(QUESTIONNAIRES[line])) as Question[]
}

export function buildFormLibrary(): ReviewForm[] {
  const rnd = mulberry32(424242)
  const forms: ReviewForm[] = []
  let n = 0
  for (const segment of FORM_SEGMENTS) {
    for (const line of FORM_LINES) {
      for (const scope of FORM_SCOPES[line]) {
        for (const tier of FORM_TIERS) {
          const r = rnd()
          const status: FormStatus = r < 0.72 ? 'Published' : r < 0.9 ? 'Draft' : 'Archived'
          // Express tiers skew real-time/targeted; thorough tiers skew diagnostic
          const targetedBias = tier === 'Express' ? 0.75 : tier === 'Standard' ? 0.4 : 0.18
          const reviewType: ReviewType = rnd() < targetedBias ? 'Targeted' : 'Diagnostic'
          const daysAgo = Math.floor(rnd() * 160)
          const d = new Date(2026, 5, 9)
          d.setDate(d.getDate() - daysAgo)
          forms.push({
            id: `form_${n++}`,
            name: `${segment} ${line} — ${scope} (${tier})`,
            line,
            scope,
            segment,
            reviewType,
            status,
            version: 1 + Math.floor(rnd() * 4),
            updated: d.toISOString().slice(0, 10),
            questions: cloneSpine(line),
          })
        }
      }
    }
  }
  return forms
}

/** the default published form a claim of this line is reviewed against */
export function defaultFormForLine(forms: ReviewForm[], line: Line): ReviewForm | undefined {
  return forms.find((f) => f.line === line && f.status === 'Published' && f.segment === 'Personal') || forms.find((f) => f.line === line)
}
