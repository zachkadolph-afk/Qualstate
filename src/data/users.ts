/* ------------------------------------------------------------------ */
/*  Users — the reviewer pool + admins. Owned by the store so login,   */
/*  assignment, and User Management all share one source of truth.     */
/* ------------------------------------------------------------------ */

export type Role = 'Reviewer' | 'Lead Reviewer' | 'Manager' | 'Technical Analyst' | 'System Manager'
export type UserStatus = 'Active' | 'Invited' | 'Disabled'

/**
 * Configuration roles — the only roles that may access Forms management,
 * User management, and Sampling/Assignment. Reviewers, Lead Reviewers, and
 * Managers are intentionally excluded.
 */
export const CONFIG_ROLES: Role[] = ['Technical Analyst', 'System Manager']

export function canConfigure(user?: { role: Role } | null): boolean {
  return !!user && CONFIG_ROLES.includes(user.role)
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  lastActive: string
  reviews: number
}

export const ROLES: Role[] = ['Reviewer', 'Lead Reviewer', 'Manager', 'Technical Analyst', 'System Manager']

export function seedUsers(): User[] {
  let i = 0
  const u = (name: string, email: string, role: Role, status: UserStatus, lastActive: string, reviews: number): User => ({
    id: `u_seed_${i++}`,
    name,
    email,
    role,
    status,
    lastActive,
    reviews,
  })
  return [
    u('A. Reyes', 'a.reyes@qualstate.ai', 'Lead Reviewer', 'Active', '2026-06-09', 142),
    u('T. Coleman', 't.coleman@qualstate.ai', 'Reviewer', 'Active', '2026-06-09', 118),
    u('M. Devi', 'm.devi@qualstate.ai', 'Reviewer', 'Active', '2026-06-08', 96),
    u('K. Park', 'k.park@qualstate.ai', 'Reviewer', 'Active', '2026-06-08', 87),
    u('J. Salazar', 'j.salazar@qualstate.ai', 'Reviewer', 'Active', '2026-06-07', 73),
    u('P. Okonkwo', 'p.okonkwo@qualstate.ai', 'Manager', 'Active', '2026-06-09', 0),
    u('R. Okafor', 'r.okafor@qualstate.ai', 'Technical Analyst', 'Active', '2026-06-09', 0),
    u('D. Whitfield', 'd.whitfield@qualstate.ai', 'System Manager', 'Active', '2026-06-06', 0),
    u('S. Brennan', 's.brennan@qualstate.ai', 'Reviewer', 'Invited', '—', 0),
    u('L. Nguyen', 'l.nguyen@qualstate.ai', 'Reviewer', 'Disabled', '2026-04-21', 54),
  ]
}

/** reviewers eligible to be assigned claims */
export function assignableReviewers(users: User[]): User[] {
  return users.filter((u) => u.status === 'Active' && (u.role === 'Reviewer' || u.role === 'Lead Reviewer'))
}
