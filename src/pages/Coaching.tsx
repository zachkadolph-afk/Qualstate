import { useMemo } from 'react'
import { Layers, Check, X, RefreshCw, AlertTriangle, Cpu, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../lib/store'
import { CoachingStatus } from '../data/coaching'
import { QUESTIONNAIRES } from '../data/questions'

/* ------------------------------------------------------------------ */
/*  Model Feedback (System Manager) — the back-end view of batched      */
/*  human–AI dissonance from completed reviews. The System Manager       */
/*  decides which areas to incorporate into the next model update.      */
/* ------------------------------------------------------------------ */

const Q_LABEL: Record<string, string> = {}
QUESTIONNAIRES.Property.forEach((q) => (Q_LABEL[q.id] = q.label))

interface Batch {
  key: string
  label: string
  count: number
  total: number
  aiHigh: number // AI said Yes, human said No (AI too lenient)
  aiLow: number // AI said No, human said Yes (AI too harsh)
  samples: string[]
}

const STATUS_STYLE: Record<CoachingStatus, string> = {
  Incorporated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
}

export default function Coaching() {
  const { coaching, addCoaching, updateCoaching, completedReviews, getClaim } = useStore()

  const { batches, totalSignals } = useMemo(() => {
    const map: Record<string, Batch> = {}
    let totalSignals = 0
    for (const r of completedReviews) {
      const claim = getClaim(r.claimId)
      if (!claim) continue
      const agentMap: Record<string, string> = {}
      claim.agentAnswers.forEach((a) => (agentMap[a.questionId] = a.value))
      for (const a of r.reviewerAnswers) {
        if (a.value == null) continue
        const agentVal = agentMap[a.questionId]
        const b = (map[a.questionId] ??= { key: a.questionId, label: Q_LABEL[a.questionId] || a.questionId, count: 0, total: 0, aiHigh: 0, aiLow: 0, samples: [] })
        b.total++
        if (a.value !== agentVal) {
          b.count++
          totalSignals++
          if (agentVal === 'yes' && a.value === 'no') b.aiHigh++
          else if (agentVal === 'no' && a.value === 'yes') b.aiLow++
          if (b.samples.length < 4) b.samples.push(claim.claimNumber)
        }
      }
    }
    const batches = Object.values(map)
      .filter((b) => b.count > 0)
      .sort((a, b) => b.count - a.count)
    return { batches, totalSignals }
  }, [completedReviews, getClaim])

  const decisionFor = (key: string) => coaching.find((c) => c.key === key)
  function decide(key: string, label: string, status: CoachingStatus) {
    const existing = decisionFor(key)
    if (existing) updateCoaching(existing.id, { status })
    else addCoaching({ key, label, status, note: '' })
  }

  const incorporated = coaching.filter((c) => c.status === 'Incorporated').length
  const dismissed = coaching.filter((c) => c.status === 'Dismissed').length
  const pending = batches.filter((b) => !decisionFor(b.key)).length

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Model Feedback"
          subtitle="Batched human–AI dissonance from completed reviews. Decide what to push into the next model update."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Cpu size={16} className="text-brand-500" />
              <span className="font-semibold text-brand-950">{totalSignals}</span> dissonance signals
            </div>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Kpi icon={Layers} label="Dissonance signals" value={`${totalSignals}`} sub="human ≠ AI, all reviews" />
          <Kpi icon={AlertTriangle} label="Awaiting decision" value={`${pending}`} sub="areas to triage" orange />
          <Kpi icon={RefreshCw} label="Incorporated" value={`${incorporated}`} sub="queued for next update" />
          <Kpi icon={X} label="Dismissed" value={`${dismissed}`} sub="not model errors" />
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
          <Cpu size={15} className="text-brand-500" />
          Each area below batches every review where a human disagreed with the AI. Incorporating queues that correction for the next training cycle.
        </div>

        <div className="space-y-3">
          {batches.map((b) => {
            const decision = decisionFor(b.key)
            const leansHigh = b.aiHigh >= b.aiLow
            return (
              <Card key={b.key} className="p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-950">{b.label}</span>
                      <span className="text-xs text-slate-400">· {b.count} of {b.total} reviews</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-sm">
                      {leansHigh ? (
                        <span className="flex items-center gap-1 text-orange-600 font-semibold"><TrendingUp size={14} /> AI too lenient</span>
                      ) : (
                        <span className="flex items-center gap-1 text-brand-600 font-semibold"><TrendingDown size={14} /> AI too harsh</span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-xs">{b.aiHigh} said Yes→No · {b.aiLow} said No→Yes</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">e.g. {b.samples.join(', ')}{b.count > b.samples.length ? ' …' : ''}</div>
                  </div>

                  {/* signal strength bar */}
                  <div className="w-40 shrink-0">
                    <div className="text-[11px] text-slate-400 mb-1">disagreement rate</div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-accent-500" style={{ width: `${Math.round((b.count / b.total) * 100)}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 tabular-nums">{Math.round((b.count / b.total) * 100)}%</div>
                  </div>

                  {/* decision */}
                  <div className="flex items-center gap-2">
                    {decision ? (
                      <>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[decision.status]}`}>{decision.status}</span>
                        <button onClick={() => decide(b.key, b.label, decision.status === 'Incorporated' ? 'Dismissed' : 'Incorporated')} className="text-[11px] font-semibold text-slate-400 hover:text-brand-700 border border-brand-100 rounded-md px-2 py-1">
                          Change
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => decide(b.key, b.label, 'Incorporated')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                          <Check size={14} /> Incorporate
                        </button>
                        <button onClick={() => decide(b.key, b.label, 'Dismissed')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:border-slate-400">
                          <X size={14} /> Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
          {batches.length === 0 && (
            <Card className="p-12 text-center text-slate-400">
              <Check size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold text-slate-600">No dissonance — humans and the AI agree across the board.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub, orange }: { icon: any; label: string; value: string; sub: string; orange?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg grid place-items-center ${orange ? 'text-accent-600' : 'bg-brand-50 text-brand-600'}`} style={orange ? { background: '#ffedd9' } : {}}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-1 text-2xl font-extrabold text-brand-950 tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-400">{sub}</div>
    </Card>
  )
}
