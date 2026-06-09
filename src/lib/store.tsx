import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Claim, CompletedReview, Line } from '../data/types'
import { COMPLETED_REVIEWS, HISTORY_CLAIMS, REVIEW_CLAIMS } from '../data/claims'
import { ReviewForm, ReviewType, buildFormLibrary, cloneSpine } from '../data/forms'
import { User, seedUsers, assignableReviewers } from '../data/users'
import { AssignmentRule, seedRules, matchRule } from '../data/rules'
import { POP_CLAIMS } from '../data/population'
import { AuditEvent, seedAudit } from '../data/audit'
import { CoachingItem, seedCoaching } from '../data/coaching'

/* ------------------------------------------------------------------ */
/*  Coordinated, persisted system of record. Every module reads/writes */
/*  this single store; state is saved to localStorage so the app is a  */
/*  real working system across refreshes.                              */
/* ------------------------------------------------------------------ */

export interface Assignment {
  claimId: string
  reviewer: string
  formId: string
  reviewType: ReviewType
}

export interface AssignmentOpts {
  reviewType: ReviewType
  method: 'round-robin' | 'specialty' | 'load-balanced'
}

interface Store {
  // identity
  currentUser: User
  login: (email: string) => void
  reviewer: string // back-compat: currentUser.name

  // forms library
  forms: ReviewForm[]
  addForm: (line: Line) => string
  duplicateForm: (id: string) => string
  updateForm: (id: string, fn: (f: ReviewForm) => ReviewForm) => void

  // users
  users: User[]
  addUser: (u: Omit<User, 'id'>) => void
  updateUser: (id: string, patch: Partial<User>) => void

  // assignment rules (attributes -> form + team)
  rules: AssignmentRule[]
  addRule: () => void
  updateRule: (id: string, patch: Partial<AssignmentRule>) => void
  removeRule: (id: string) => void
  moveRule: (id: string, dir: -1 | 1) => void

  // audit trail (read-only log) + coaching/dispute loop
  audit: AuditEvent[]
  coaching: CoachingItem[]
  addCoaching: (item: Omit<CoachingItem, 'id' | 'createdAt' | 'createdBy'>) => void
  updateCoaching: (id: string, patch: Partial<CoachingItem>) => void

  // claims & reviews
  reviewClaims: Claim[]
  completedReviews: CompletedReview[]
  getClaim: (id: string) => Claim | undefined
  getFormForClaim: (claim: Claim) => ReviewForm | undefined
  submitReview: (review: CompletedReview) => void

  // sampling -> queue assignment
  assignments: Record<string, Assignment>
  runAssignment: (opts: AssignmentOpts) => number
  assignFiles: (files: { id: string; line: Line; peril?: string }[], opts: { reviewType: ReviewType; method: AssignmentOpts['method']; reviewers?: string[]; autoRoute?: boolean }) => number
  clearAssignments: () => void

  resetDemo: () => void
}

const StoreContext = createContext<Store | null>(null)

const KEY = 'qualstate_state_v3'

interface Persisted {
  forms: ReviewForm[]
  users: User[]
  rules: AssignmentRule[]
  coaching: CoachingItem[]
  currentUserId: string
  submitted: CompletedReview[]
  completedIds: string[]
  assignments: Record<string, Assignment>
}

function loadPersisted(): Partial<Persisted> | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Partial<Persisted>) : null
  } catch {
    return null
  }
}

let uniq = 0
const newId = (p: string) => `${p}_${Date.now()}_${uniq++}`

function publishedFormFor(forms: ReviewForm[], line: Line, reviewType?: ReviewType): ReviewForm | undefined {
  return (
    (reviewType && forms.find((f) => f.line === line && f.status === 'Published' && f.reviewType === reviewType && f.segment === 'Personal')) ||
    (reviewType && forms.find((f) => f.line === line && f.status === 'Published' && f.reviewType === reviewType)) ||
    forms.find((f) => f.line === line && f.status === 'Published' && f.segment === 'Personal') ||
    forms.find((f) => f.line === line && f.status === 'Published') ||
    forms.find((f) => f.line === line)
  )
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boot] = useState<Partial<Persisted> | null>(() => loadPersisted())

  const [forms, setForms] = useState<ReviewForm[]>(() => boot?.forms ?? buildFormLibrary())
  const [users, setUsers] = useState<User[]>(() => boot?.users ?? seedUsers())
  const [rules, setRules] = useState<AssignmentRule[]>(() => boot?.rules ?? seedRules(boot?.forms ?? buildFormLibrary()))
  const [coaching, setCoaching] = useState<CoachingItem[]>(() => boot?.coaching ?? seedCoaching())
  const [audit, setAudit] = useState<AuditEvent[]>(() => seedAudit())
  const [currentUserId, setCurrentUserId] = useState<string>(() => boot?.currentUserId ?? '')
  const [submitted, setSubmitted] = useState<CompletedReview[]>(() => boot?.submitted ?? [])
  const [completedIds, setCompletedIds] = useState<string[]>(() => boot?.completedIds ?? [])
  const [assignments, setAssignments] = useState<Record<string, Assignment>>(() => boot?.assignments ?? {})

  // persist on any change
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ forms, users, rules, coaching, currentUserId, submitted, completedIds, assignments }))
    } catch {
      /* ignore quota errors */
    }
  }, [forms, users, rules, coaching, currentUserId, submitted, completedIds, assignments])

  const currentUser = users.find((u) => u.id === currentUserId) || assignableReviewers(users)[0] || users[0]
  const logEvent = (action: string, detail: string) =>
    setAudit((a) => [{ id: newId('aud'), at: new Date().toISOString(), actor: currentUser?.name ?? 'system', action, detail }, ...a].slice(0, 300))

  const completedSet = new Set(completedIds)
  const completedReviews = [...submitted, ...COMPLETED_REVIEWS]
  // queue = pending settled files + any assigned (open/targeted) population files
  const reviewClaims = [
    ...REVIEW_CLAIMS.filter((c) => !completedSet.has(c.id)),
    ...Object.keys(assignments)
      .filter((id) => id.startsWith('pop_') && !completedSet.has(id) && POP_CLAIMS[id])
      .map((id) => POP_CLAIMS[id]),
  ]

  const getClaim = (id: string) => REVIEW_CLAIMS.find((c) => c.id === id) || HISTORY_CLAIMS[id] || POP_CLAIMS[id]
  const getFormForClaim = (claim: Claim) => {
    const a = assignments[claim.id]
    // an explicit assignment form (from sampling) wins
    if (a?.formId) {
      const f = forms.find((x) => x.id === a.formId)
      if (f) return f
    }
    // otherwise the rules engine selects the form by attributes
    const rule = matchRule(rules, claim.line, claim.perilType, a?.reviewType)
    if (rule?.formId) {
      const f = forms.find((x) => x.id === rule.formId)
      if (f) return f
    }
    return publishedFormFor(forms, claim.line, a?.reviewType)
  }

  const value: Store = {
    currentUser,
    reviewer: currentUser?.name ?? 'A. Reyes',
    login: (email: string) => {
      const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.status !== 'Disabled')
      const fallback = assignableReviewers(users)[0] || users[0]
      const u = match || fallback
      setCurrentUserId(u?.id ?? '')
      setAudit((a) => [{ id: newId('aud'), at: new Date().toISOString(), actor: u?.name ?? email, action: 'Signed in', detail: `${u?.role ?? 'Reviewer'} session` }, ...a].slice(0, 300))
    },

    forms,
    addForm: (line) => {
      const id = newId('form')
      setForms((fs) => [
        {
          id,
          name: `New ${line} Review Form`,
          line,
          scope: 'All perils',
          segment: 'Personal',
          reviewType: 'Diagnostic',
          status: 'Draft',
          version: 1,
          updated: '2026-06-09',
          questions: cloneSpine(line),
        },
        ...fs,
      ])
      return id
    },
    duplicateForm: (srcId) => {
      const id = newId('form')
      setForms((fs) => {
        const src = fs.find((f) => f.id === srcId)
        if (!src) return fs
        return [{ ...JSON.parse(JSON.stringify(src)), id, name: `${src.name} (copy)`, status: 'Draft', version: 1, updated: '2026-06-09' }, ...fs]
      })
      return id
    },
    updateForm: (id, fn) => setForms((fs) => fs.map((f) => (f.id === id ? fn(f) : f))),

    users,
    addUser: (u) => {
      setUsers((us) => [{ ...u, id: newId('u') }, ...us])
      logEvent('User invited', `${u.email} as ${u.role}`)
    },
    updateUser: (id, patch) => {
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)))
      const u = users.find((x) => x.id === id)
      logEvent('User updated', `${u?.name ?? id}${patch.role ? ' · ' + patch.role : ''}${patch.status ? ' · ' + patch.status : ''}${patch.team ? ' · ' + patch.team : ''}`)
    },

    rules,
    addRule: () => {
      setRules((rs) => [...rs, { id: newId('rule'), line: 'Any', peril: 'Any', segment: 'Any', reviewType: 'Any', formId: forms.find((f) => f.status === 'Published')?.id ?? '', team: 'Any', enabled: true }])
      logEvent('Rule added', 'New assignment rule')
    },
    updateRule: (id, patch) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    removeRule: (id) => {
      setRules((rs) => rs.filter((r) => r.id !== id))
      logEvent('Rule removed', `rule ${id}`)
    },
    moveRule: (id, dir) =>
      setRules((rs) => {
        const arr = [...rs]
        const i = arr.findIndex((r) => r.id === id)
        const j = i + dir
        if (j < 0 || j >= arr.length) return rs
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        return arr
      }),

    reviewClaims,
    completedReviews,
    getClaim,
    getFormForClaim,
    submitReview: (review) => {
      setSubmitted((prev) => [review, ...prev])
      setCompletedIds((prev) => (prev.includes(review.claimId) ? prev : [...prev, review.claimId]))
      // credit the reviewer
      setUsers((us) => us.map((u) => (u.name === review.reviewer ? { ...u, reviews: u.reviews + 1, lastActive: review.completedAt } : u)))
      logEvent('Review submitted', `${review.claimId} · quality ${review.qualityScore} · cal ${review.calibration}%`)
    },

    audit,
    coaching,
    addCoaching: (item) => {
      setCoaching((cs) => [{ ...item, id: newId('co'), createdBy: currentUser?.name ?? 'system', createdAt: new Date().toISOString().slice(0, 10) }, ...cs])
      logEvent(`Model feedback ${item.status.toLowerCase()}`, `${item.label} dissonance`)
    },
    updateCoaching: (id, patch) => setCoaching((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c))),

    assignments,
    runAssignment: ({ reviewType, method }) => {
      const pool = assignableReviewers(users)
      if (pool.length === 0) return 0
      const pending = REVIEW_CLAIMS.filter((c) => !completedSet.has(c.id))
      const next: Record<string, Assignment> = {}
      // simple per-line load counters for load-balanced
      const load: Record<string, number> = {}
      pool.forEach((p) => (load[p.name] = 0))
      pending.forEach((claim, i) => {
        let reviewer: string
        if (method === 'load-balanced') {
          reviewer = pool.reduce((min, p) => (load[p.name] < load[min.name] ? p : min), pool[0]).name
          load[reviewer]++
        } else {
          // round-robin (specialty falls back to round-robin in this prototype)
          reviewer = pool[i % pool.length].name
        }
        const form = publishedFormFor(forms, claim.line, reviewType)
        next[claim.id] = { claimId: claim.id, reviewer, formId: form?.id ?? '', reviewType }
      })
      setAssignments(next)
      logEvent('Assignment run', `${Object.keys(next).length} files as ${reviewType}`)
      return Object.keys(next).length
    },
    assignFiles: (files, { reviewType, method, reviewers, autoRoute }) => {
      const fallbackPool = reviewers && reviewers.length ? reviewers : assignableReviewers(users).map((u) => u.name)
      if (files.length === 0) return 0
      const next = { ...assignments }
      const load: Record<string, number> = {}
      Object.values(next).forEach((a) => (load[a.reviewer] = (load[a.reviewer] || 0) + 1))
      const rr: Record<string, number> = {}
      let assigned = 0
      files.forEach((f) => {
        // rule-based routing: the matching rule's team (and form) take over
        const rule = autoRoute ? matchRule(rules, f.line, f.peril ?? '', reviewType) : undefined
        const teamName = rule && rule.team !== 'Any' ? rule.team : undefined
        let names = teamName ? assignableReviewers(users).filter((u) => u.team === teamName).map((u) => u.name) : fallbackPool
        if (!names.length) names = fallbackPool
        if (!names.length) return
        const key = names.join('|')
        let reviewer: string
        if (method === 'load-balanced') {
          reviewer = names.reduce((m, n) => ((load[n] || 0) < (load[m] || 0) ? n : m), names[0])
        } else {
          rr[key] = (rr[key] ?? -1) + 1
          reviewer = names[rr[key] % names.length]
        }
        load[reviewer] = (load[reviewer] || 0) + 1
        const ruleForm = rule?.formId ? forms.find((x) => x.id === rule.formId) : undefined
        const form = ruleForm || publishedFormFor(forms, f.line, reviewType)
        next[f.id] = { claimId: f.id, reviewer, formId: form?.id ?? '', reviewType }
        assigned++
      })
      setAssignments(next)
      logEvent('Files assigned', `${assigned} ${reviewType} files${autoRoute ? ' (routed by rules)' : ''}`)
      return assigned
    },
    clearAssignments: () => setAssignments({}),

    resetDemo: () => {
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* ignore */
      }
      const freshForms = buildFormLibrary()
      setForms(freshForms)
      setUsers(seedUsers())
      setRules(seedRules(freshForms))
      setCoaching(seedCoaching())
      setAudit(seedAudit())
      setCurrentUserId('')
      setSubmitted([])
      setCompletedIds([])
      setAssignments({})
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
