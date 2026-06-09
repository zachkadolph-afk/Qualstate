import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { Claim, CompletedReview } from '../data/types'
import { COMPLETED_REVIEWS, HISTORY_CLAIMS, REVIEW_CLAIMS } from '../data/claims'

interface Store {
  reviewClaims: Claim[]
  completedReviews: CompletedReview[]
  getClaim: (id: string) => Claim | undefined
  submitReview: (review: CompletedReview) => void
  reviewer: string
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [completedReviews, setCompletedReviews] = useState<CompletedReview[]>(COMPLETED_REVIEWS)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const value = useMemo<Store>(() => {
    const reviewClaims = REVIEW_CLAIMS.filter((c) => !completedIds.has(c.id))
    return {
      reviewClaims,
      completedReviews,
      reviewer: 'A. Reyes',
      getClaim: (id: string) =>
        REVIEW_CLAIMS.find((c) => c.id === id) || HISTORY_CLAIMS[id],
      submitReview: (review: CompletedReview) => {
        setCompletedReviews((prev) => [review, ...prev])
        setCompletedIds((prev) => new Set(prev).add(review.claimId))
      },
    }
  }, [completedReviews, completedIds])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
