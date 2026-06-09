import { Line } from './types'
import { ReviewForm, ReviewType } from './forms'
import { Team } from './users'

/* ------------------------------------------------------------------ */
/*  Assignment rules — map a claim's attributes to the form it should  */
/*  be reviewed against and the team that should handle it. Evaluated  */
/*  top-to-bottom; first enabled match wins.                           */
/* ------------------------------------------------------------------ */

export interface AssignmentRule {
  id: string
  line: Line | 'Any'
  peril: string | 'Any'
  segment: string | 'Any'
  reviewType: ReviewType | 'Any'
  formId: string
  team: Team | 'Any'
  enabled: boolean
}

function findFormId(forms: ReviewForm[], line: Line, reviewType: ReviewType): string {
  const f =
    forms.find((x) => x.line === line && x.status === 'Published' && x.reviewType === reviewType && x.segment === 'Personal') ||
    forms.find((x) => x.line === line && x.status === 'Published' && x.reviewType === reviewType) ||
    forms.find((x) => x.line === line && x.status === 'Published') ||
    forms.find((x) => x.line === line)
  return f?.id ?? ''
}

let seedId = 0
export function seedRules(forms: ReviewForm[]): AssignmentRule[] {
  const r = (line: Line, peril: string | 'Any', reviewType: ReviewType, team: Team | 'Any'): AssignmentRule => ({
    id: `rule_seed_${seedId++}`,
    line,
    peril,
    segment: 'Any',
    reviewType,
    formId: findFormId(forms, line, reviewType),
    team,
    enabled: true,
  })
  return [
    r('Casualty', 'Bodily Injury', 'Targeted', 'Complex & Litigation'),
    r('Property', 'Fire', 'Diagnostic', 'Complex & Litigation'),
    r('Property', 'Water Damage', 'Diagnostic', 'Property — West'),
    r('Auto', 'Total Loss', 'Diagnostic', 'Auto — National'),
    r('Auto', 'Any', 'Targeted', 'Auto — National'),
    r('Casualty', 'Any', 'Diagnostic', 'Casualty — GL'),
    r('Property', 'Any', 'Diagnostic', 'Property — East'),
  ]
}

/** first enabled rule that matches the claim attributes; segment is advisory */
export function matchRule(rules: AssignmentRule[], line: Line, peril: string, reviewType?: ReviewType): AssignmentRule | undefined {
  return rules.find(
    (r) =>
      r.enabled &&
      (r.line === 'Any' || r.line === line) &&
      (r.peril === 'Any' || (peril && peril.toLowerCase().includes(r.peril.toLowerCase()))) &&
      (r.reviewType === 'Any' || !reviewType || r.reviewType === reviewType),
  )
}
