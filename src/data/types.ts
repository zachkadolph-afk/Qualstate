export type Line = 'Property' | 'Auto' | 'Casualty'

export type AnswerValue = 'yes' | 'partial' | 'no' | 'na'

export interface Question {
  id: string
  /** short label for charts */
  label: string
  /** the full prompt the agent answers */
  prompt: string
  /** category bucket for grouping */
  category: string
  /** scoring weight */
  weight: number
}

export interface AgentAnswer {
  questionId: string
  value: AnswerValue
  /** AI rationale citing file evidence */
  rationale: string
  /** model self-reported confidence 0-1 */
  confidence: number
  /** supporting evidence snippets pulled from the file */
  evidence: string[]
}

export type ReviewDecision = 'agree' | 'disagree' | null

export interface ReviewerAnswer {
  questionId: string
  decision: ReviewDecision
  /** when disagreeing, the corrected value */
  correctedValue?: AnswerValue
  note?: string
}

export interface ClaimParty {
  name: string
  role: string
}

export interface Claim {
  id: string
  claimNumber: string
  policyNumber: string
  line: Line
  perilType: string
  status: 'Ready for Review' | 'In Review' | 'Completed'
  dateOfLoss: string
  dateClosed: string
  insured: string
  adjuster: string
  state: string
  reserveAmount: number
  paidAmount: number
  severity: 'Low' | 'Moderate' | 'High' | 'Severe'
  /** the one-pager narrative */
  summary: string
  /** quick fact chips */
  facts: { label: string; value: string }[]
  /** timeline of file activity */
  timeline: { date: string; event: string }[]
  parties: ClaimParty[]
  agentAnswers: AgentAnswer[]
}

export interface CompletedReview {
  claimId: string
  reviewer: string
  completedAt: string
  reviewerAnswers: ReviewerAnswer[]
  qualityScore: number
  agentScore: number
  calibration: number
  /** which form drove this review (coordinated system) */
  formId?: string
  /** Diagnostic (outcome-based) or Targeted (real-time) */
  reviewType?: 'Diagnostic' | 'Targeted'
}
