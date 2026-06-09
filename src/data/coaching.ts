/* ------------------------------------------------------------------ */
/*  Model feedback decisions — the System Manager's back-end ledger of  */
/*  which areas of human–AI dissonance have been incorporated into (or  */
/*  dismissed from) the next model update. The dissonance itself is     */
/*  derived from completed reviews; this only records the decisions.    */
/* ------------------------------------------------------------------ */

export type CoachingStatus = 'Incorporated' | 'Dismissed'

export interface CoachingItem {
  id: string
  /** the dissonance area key (a question id) */
  key: string
  label: string
  status: CoachingStatus
  note: string
  createdBy: string
  createdAt: string
}

let i = 0
export function seedCoaching(): CoachingItem[] {
  const c = (key: string, label: string, status: CoachingStatus, note: string, by: string, daysAgo: number): CoachingItem => {
    const d = new Date(2026, 5, 9)
    d.setDate(d.getDate() - daysAgo)
    return { id: `co_seed_${i++}`, key, label, status, note, createdBy: by, createdAt: d.toISOString().slice(0, 10) }
  }
  return [
    c('compliance', 'Compliance', 'Incorporated', 'Reviewers consistently corrected the AI on state-timeline edge cases — queued for the next model update.', 'D. Whitfield', 3),
    c('recovery', 'Subrogation', 'Dismissed', 'Disagreements were judgment calls, not model errors — not incorporating this cycle.', 'D. Whitfield', 6),
  ]
}
