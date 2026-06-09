import { Team } from './users'

/* ------------------------------------------------------------------ */
/*  Coaching & disputes — the operational loop that turns a quality    */
/*  finding into action: coach an adjuster/team or dispute a score.    */
/* ------------------------------------------------------------------ */

export type CoachingKind = 'Coaching' | 'Dispute'
export type CoachingStatus = 'Open' | 'Acknowledged' | 'Resolved'

export interface CoachingItem {
  id: string
  claimId: string
  claimNumber: string
  claimType: string
  kind: CoachingKind
  status: CoachingStatus
  note: string
  team: Team | '—'
  createdBy: string
  createdAt: string
}

let i = 0
export function seedCoaching(): CoachingItem[] {
  const c = (claimNumber: string, claimType: string, kind: CoachingKind, status: CoachingStatus, note: string, team: Team | '—', by: string, daysAgo: number): CoachingItem => {
    const d = new Date(2026, 5, 9)
    d.setDate(d.getDate() - daysAgo)
    return { id: `co_seed_${i++}`, claimId: '', claimNumber, claimType, kind, status, note, team, createdBy: by, createdAt: d.toISOString().slice(0, 10) }
  }
  return [
    c('PR-2024-5108', 'Property · Wind/Hail', 'Coaching', 'Open', 'Investigation depth low on contested denials — reinforce engineer-referral threshold.', 'Property — East', 'P. Okonkwo', 2),
    c('CA-2024-9920', 'Casualty · Premises', 'Coaching', 'Acknowledged', 'Reserve adequacy lagged surgical exposure — review reserve triggers.', 'Casualty — GL', 'P. Okonkwo', 4),
    c('AU-2024-8841', 'Auto · Total Loss', 'Dispute', 'Open', 'Adjuster disputes the documentation score — valuation notes were attached separately.', 'Auto — National', 'M. Devi', 1),
  ]
}
