import { useMemo, useState } from 'react'
import { Search, ScrollText } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../lib/store'

/* ------------------------------------------------------------------ */
/*  Audit Trail — append-only log of who did what. System Manager only.*/
/* ------------------------------------------------------------------ */

function fmt(at: string) {
  const d = new Date(at)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const ACTION_STYLE: Record<string, string> = {
  'Signed in': 'bg-slate-100 text-slate-600',
  'Review submitted': 'bg-emerald-50 text-emerald-700',
  'Files assigned': 'bg-brand-50 text-brand-700',
  'Assignment run': 'bg-brand-50 text-brand-700',
  'Rule added': 'bg-violet-50 text-violet-700',
  'Rule removed': 'bg-red-50 text-red-700',
  'User invited': 'bg-amber-50 text-amber-700',
  'User updated': 'bg-amber-50 text-amber-700',
  'Coaching opened': 'bg-sky-50 text-sky-700',
  'Dispute raised': 'bg-orange-50 text-orange-700',
  'Form edited': 'bg-slate-100 text-slate-600',
}

export default function Audit() {
  const { audit } = useStore()
  const [q, setQ] = useState('')
  const [action, setAction] = useState<'All' | string>('All')

  const actions = useMemo(() => ['All', ...Array.from(new Set(audit.map((e) => e.action)))], [audit])
  const filtered = useMemo(
    () => audit.filter((e) => (action === 'All' || e.action === action) && (!q || `${e.actor} ${e.detail} ${e.action}`.toLowerCase().includes(q.toLowerCase()))),
    [audit, action, q],
  )

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <PageHeader
          title="Audit Trail"
          subtitle="Immutable record of activity across the platform — for compliance and traceability."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <ScrollText size={16} className="text-brand-500" />
              <span className="font-semibold text-brand-950">{audit.length}</span> events
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex flex-wrap bg-white rounded-xl border border-brand-100 p-1 shadow-card">
            {actions.map((a) => (
              <button key={a} onClick={() => setAction(a)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${action === a ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-brand-700'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actor or detail…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-100 bg-white text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-brand-50">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs text-slate-400 w-28 shrink-0 tabular-nums">{fmt(e.at)}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${ACTION_STYLE[e.action] || 'bg-slate-100 text-slate-600'}`}>{e.action}</span>
                <span className="text-sm font-semibold text-brand-950 w-32 shrink-0 truncate">{e.actor}</span>
                <span className="text-sm text-slate-500 flex-1 min-w-0 truncate">{e.detail}</span>
              </div>
            ))}
            {filtered.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-400">No events match.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
