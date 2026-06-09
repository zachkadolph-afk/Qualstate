import { Claim, Line } from '../data/types'
import { Team } from '../data/users'

/* ------------------------------------------------------------------ */
/*  Results scope — the claim-type filters that drive the Results       */
/*  dashboard. Prefilled from the signed-in user's team/line.           */
/* ------------------------------------------------------------------ */

export interface Scope {
  line: 'All' | Line
  peril: 'All' | string
  team: 'All' | Team
  state: 'All' | string
}

export const ALL_SCOPE: Scope = { line: 'All', peril: 'All', team: 'All', state: 'All' }

export function basePeril(perilType: string): string {
  return perilType.split('—')[0].trim()
}

/** a team name implies its line of business (e.g. "Property — West" -> Property) */
export function teamToLine(team?: string | null): 'All' | Line {
  if (!team) return 'All'
  if (team.startsWith('Property')) return 'Property'
  if (team.startsWith('Auto')) return 'Auto'
  if (team.startsWith('Casualty')) return 'Casualty'
  return 'All'
}

/** prefill the scope from the user's assignment (team -> line + team) */
export function defaultScopeFor(user?: { team?: Team | '—'; role?: string } | null): Scope {
  const team = user?.team && user.team !== '—' ? (user.team as Team) : undefined
  return { line: teamToLine(team), peril: 'All', team: team ?? 'All', state: 'All' }
}

export function inScope(claim: Claim | undefined, reviewerTeam: string | undefined, s: Scope): boolean {
  if (!claim) return false
  if (s.line !== 'All' && claim.line !== s.line) return false
  if (s.peril !== 'All' && basePeril(claim.perilType) !== s.peril) return false
  if (s.state !== 'All' && claim.state !== s.state) return false
  if (s.team !== 'All' && reviewerTeam !== s.team) return false
  return true
}
