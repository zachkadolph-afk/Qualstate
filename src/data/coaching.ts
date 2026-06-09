/* ------------------------------------------------------------------ */
/*  Model feedback — claim-quality results are disseminated, and users  */
/*  validate or rebut the AI's finding. This human input is the signal  */
/*  that improves the model; it is NOT employee performance coaching.   */
/* ------------------------------------------------------------------ */

export type CoachingKind = 'Validation' | 'Rebuttal'
export type CoachingStatus = 'Submitted' | 'Incorporated' | 'Dismissed'

export interface CoachingItem {
  id: string
  claimId: string
  claimNumber: string
  claimType: string
  kind: CoachingKind
  status: CoachingStatus
  note: string
  createdBy: string
  createdAt: string
}

let i = 0
export function seedCoaching(): CoachingItem[] {
  const c = (claimNumber: string, claimType: string, kind: CoachingKind, status: CoachingStatus, note: string, by: string, daysAgo: number): CoachingItem => {
    const d = new Date(2026, 5, 9)
    d.setDate(d.getDate() - daysAgo)
    return { id: `co_seed_${i++}`, claimId: '', claimNumber, claimType, kind, status, note, createdBy: by, createdAt: d.toISOString().slice(0, 10) }
  }
  return [
    c('PR-2024-5108', 'Property · Wind/Hail', 'Rebuttal', 'Submitted', 'AI marked Investigation "No," but an engineer referral was on file under a separate doc — the finding is too harsh.', 'A. Reyes', 2),
    c('CA-2024-9920', 'Casualty · Premises', 'Validation', 'Incorporated', 'Confirmed the reserve-adequacy gap — the AI read it correctly. Good signal to reinforce.', 'K. Park', 4),
    c('AU-2024-8841', 'Auto · Total Loss', 'Rebuttal', 'Submitted', 'Documentation scored low, but valuation notes were attached separately — the model missed them.', 'M. Devi', 1),
  ]
}
