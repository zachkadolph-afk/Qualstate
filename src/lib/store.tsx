import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Claim, CompletedReview, Line } from '../data/types'
import { COMPLETED_REVIEWS, HISTORY_CLAIMS, REVIEW_CLAIMS } from '../data/claims'
import { ReviewForm, ReviewType, buildFormLibrary, cloneSpine } from '../data/forms'
import { User, seedUsers, assignableReviewers } from '../data/users'

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

  // claims & reviews
  reviewClaims: Claim[]
  completedReviews: CompletedReview[]
  getClaim: (id: string) => Claim | undefined
  getFormForClaim: (claim: Claim) => ReviewForm | undefined
  submitReview: (review: CompletedReview) => void

  // sampling -> queue assignment
  assignments: Record<string, Assignment>
  runAssignment: (opts: AssignmentOpts) => number
  clearAssignments: () => void

  resetDemo: () => void
}

const StoreContext = createContext<Store | null>(null)

const KEY = 'qualstate_state_v1'

interface Persisted {
  forms: ReviewForm[]
  users: User[]
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
  const [currentUserId, setCurrentUserId] = useState<string>(() => boot?.currentUserId ?? '')
  const [submitted, setSubmitted] = useState<CompletedReview[]>(() => boot?.submitted ?? [])
  const [completedIds, setCompletedIds] = useState<string[]>(() => boot?.completedIds ?? [])
  const [assignments, setAssignments] = useState<Record<string, Assignment>>(() => boot?.assignments ?? {})

  // persist on any change
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ forms, users, currentUserId, submitted, completedIds, assignments }))
    } catch {
      /* ignore quota errors */
    }
  }, [forms, users, currentUserId, submitted, completedIds, assignments])

  const currentUser = users.find((u) => u.id === currentUserId) || assignableReviewers(users)[0] || users[0]

  const completedSet = new Set(completedIds)
  const completedReviews = [...submitted, ...COMPLETED_REVIEWS]
  const reviewClaims = REVIEW_CLAIMS.filter((c) => !completedSet.has(c.id))

  const getClaim = (id: string) => REVIEW_CLAIMS.find((c) => c.id === id) || HISTORY_CLAIMS[id]
  const getFormForClaim = (claim: Claim) => {
    const a = assignments[claim.id]
    if (a) return forms.find((f) => f.id === a.formId) || publishedFormFor(forms, claim.line, a.reviewType)
    return publishedFormFor(forms, claim.line)
  }

  const value: Store = {
    currentUser,
    reviewer: currentUser?.name ?? 'A. Reyes',
    login: (email: string) => {
      const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.status !== 'Disabled')
      const fallback = assignableReviewers(users)[0] || users[0]
      setCurrentUserId((match || fallback)?.id ?? '')
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
    addUser: (u) => setUsers((us) => [{ ...u, id: newId('u') }, ...us]),
    updateUser: (id, patch) => setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u))),

    reviewClaims,
    completedReviews,
    getClaim,
    getFormForClaim,
    submitReview: (review) => {
      setSubmitted((prev) => [review, ...prev])
      setCompletedIds((prev) => (prev.includes(review.claimId) ? prev : [...prev, review.claimId]))
      // credit the reviewer
      setUsers((us) => us.map((u) => (u.name === review.reviewer ? { ...u, reviews: u.reviews + 1, lastActive: review.completedAt } : u)))
    },

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
      return Object.keys(next).length
    },
    clearAssignments: () => setAssignments({}),

    resetDemo: () => {
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* ignore */
      }
      setForms(buildFormLibrary())
      setUsers(seedUsers())
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
