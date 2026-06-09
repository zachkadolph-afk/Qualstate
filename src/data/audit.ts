/* ------------------------------------------------------------------ */
/*  Audit trail — an append-only log of who did what. Seeded with some  */
/*  history; live actions append during the session.                   */
/* ------------------------------------------------------------------ */

export interface AuditEvent {
  id: string
  at: string // ISO timestamp
  actor: string
  action: string
  detail: string
}

let i = 0
export function seedAudit(): AuditEvent[] {
  const e = (daysAgo: number, hour: number, actor: string, action: string, detail: string): AuditEvent => {
    const d = new Date(2026, 5, 9)
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, (i * 7) % 60, 0, 0)
    return { id: `aud_seed_${i++}`, at: d.toISOString(), actor, action, detail }
  }
  return [
    e(0, 9, 'D. Whitfield', 'Signed in', 'System Manager session'),
    e(0, 9, 'R. Okafor', 'Rule updated', 'Casualty · Bodily Injury → Complex & Litigation'),
    e(0, 10, 'A. Reyes', 'Review submitted', 'CA-2024-1077 · quality 84'),
    e(0, 11, 'D. Whitfield', 'Files assigned', '8 Diagnostic files routed by rules'),
    e(1, 14, 'R. Okafor', 'Form edited', 'Personal Auto — Total Loss (Standard) v3'),
    e(1, 15, 'P. Okonkwo', 'Signed in', 'Manager session'),
    e(2, 9, 'A. Reyes', 'Review submitted', 'PR-2024-4471 · quality 82'),
    e(2, 16, 'D. Whitfield', 'User invited', 's.brennan@qualstate.ai as Reviewer'),
    e(3, 10, 'T. Coleman', 'Review submitted', 'AU-2024-7732 · quality 91'),
    e(3, 13, 'R. Okafor', 'Rule added', 'Property · Fire → Complex & Litigation'),
    e(4, 11, 'D. Whitfield', 'User updated', 'L. Nguyen disabled'),
    e(5, 9, 'K. Park', 'Review submitted', 'CA-2024-9920 · quality 73'),
  ]
}
