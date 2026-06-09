import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Clock, Sparkles, CheckCircle2, UserCheck, Activity } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, LinePill, SeverityChip, PageHeader } from '../components/ui'
import { Line } from '../data/types'
import { currency } from '../lib/scoring'

const FILTERS: ('All' | Line)[] = ['All', 'Property', 'Auto', 'Casualty']

export default function Queue() {
  const { reviewClaims, completedReviews, assignments, currentUser } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'All' | Line>('All')
  const [typeFilter, setTypeFilter] = useState<'All' | 'Diagnostic' | 'Targeted'>('All')
  const [myQueue, setMyQueue] = useState(false)
  const [q, setQ] = useState('')

  const assignedCount = Object.keys(assignments).length

  const filtered = useMemo(() => {
    return reviewClaims.filter((c) => {
      const a = assignments[c.id]
      if (filter !== 'All' && c.line !== filter) return false
      if (typeFilter !== 'All' && a?.reviewType !== typeFilter) return false
      if (myQueue && a?.reviewer !== currentUser?.name) return false
      if (q && !`${c.claimNumber} ${c.insured} ${c.perilType}`.toLowerCase().includes(q.toLowerCase()))
        return false
      return true
    })
  }, [reviewClaims, filter, typeFilter, myQueue, q, assignments, currentUser])

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="Review Queue"
          subtitle="Settled claims with an AI first-pass, ready for reviewer validation."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="font-semibold text-brand-950">{completedReviews.length}</span> reviewed
              this quarter
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex bg-white rounded-xl border border-brand-100 p-1 shadow-card">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  filter === f ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-brand-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {assignedCount > 0 && (
            <>
              <div className="flex bg-white rounded-xl border border-brand-100 p-1 shadow-card">
                {(['All', 'Diagnostic', 'Targeted'] as const).map((t) => (
                  <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${typeFilter === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-brand-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={() => setMyQueue((m) => !m)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border shadow-card transition-colors ${myQueue ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-brand-100 text-slate-600 hover:text-brand-700'}`}>
                <UserCheck size={15} /> My queue
              </button>
            </>
          )}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search claim, insured, peril…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-100 bg-white text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((c) => {
            const lowConf = c.agentAnswers.filter((a) => a.confidence < 0.7).length
            return (
              <Card
                key={c.id}
                className="p-5 hover:shadow-glow transition-shadow cursor-pointer group"
              >
                <div
                  onClick={() => navigate(`/review/${c.id}`)}
                  className="flex items-center gap-5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-brand-950">{c.claimNumber}</span>
                      <LinePill line={c.line} />
                      <SeverityChip severity={c.severity} />
                      <span className="text-xs text-slate-400">· {c.state}</span>
                    </div>
                    <div className="mt-1.5 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">{c.perilType}</span> · {c.insured}{' '}
                      · Adjuster {c.adjuster}
                    </div>
                    <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> Closed {c.dateClosed}
                      </span>
                      <span>Paid {currency(c.paidAmount)}</span>
                      <span className="flex items-center gap-1 text-brand-600 font-medium">
                        <Sparkles size={13} /> AI first-pass complete
                      </span>
                      {lowConf > 0 && (
                        <span className="flex items-center gap-1 text-accent-600 font-semibold">
                          {lowConf} low-confidence answer{lowConf > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {assignments[c.id] && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${assignments[c.id].reviewType === 'Targeted' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>
                          <Activity size={10} /> {assignments[c.id].reviewType}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                          <UserCheck size={11} /> {assignments[c.id].reviewer}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-brand-600 font-semibold text-sm group-hover:gap-3 transition-all">
                      Review <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          {filtered.length === 0 && (
            <Card className="p-12 text-center text-slate-400">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold text-slate-600">Queue clear</p>
              <p className="text-sm">No claims match this filter. Nice work.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
