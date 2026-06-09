import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Clock, Activity, Play, Check, ArrowRight, Users2, Shuffle, Layers, Target, AlertTriangle } from 'lucide-react'
import { Card, PageHeader, LinePill, SeverityChip } from '../components/ui'
import { useStore } from '../lib/store'
import { assignableReviewers, TEAMS, Team } from '../data/users'
import { ReviewType } from '../data/forms'
import { POPULATION } from '../data/population'
import { Line } from '../data/types'
import { currency } from '../lib/scoring'

/* ------------------------------------------------------------------ */
/*  Sampling & Assignment — the sample is split into Diagnostic         */
/*  (outcome-based, closed claims) and Targeted (real-time, open        */
/*  claims) cohorts. Pick files within a cohort and assign them to the  */
/*  reviewer pool (writes to the shared store → Queue).                 */
/* ------------------------------------------------------------------ */

type Strategy = 'full' | 'random' | 'risk'
type Method = 'round-robin' | 'specialty' | 'load-balanced'
type Line2 = 'All' | Line

interface FileRow {
  id: string
  claimNumber: string
  line: Line
  peril: string
  severity: 'Low' | 'Moderate' | 'High' | 'Severe'
  reserve: number
  team: string
  flags: string[]
  real: boolean
}

const SEV_RANK: Record<string, number> = { Low: 0, Moderate: 1, High: 2, Severe: 3 }
const STRATEGIES: { id: Strategy; icon: any; title: string }[] = [
  { id: 'full', icon: Layers, title: 'Full' },
  { id: 'random', icon: Shuffle, title: 'Random' },
  { id: 'risk', icon: Target, title: 'Risk-based' },
]
const METHODS: { id: Method; title: string }[] = [
  { id: 'round-robin', title: 'Round-robin' },
  { id: 'specialty', title: 'By specialty' },
  { id: 'load-balanced', title: 'Load-balanced' },
]

export default function Sampling() {
  const navigate = useNavigate()
  const { reviewClaims, users, assignments, assignFiles, clearAssignments } = useStore()

  const [reviewType, setReviewType] = useState<ReviewType>('Diagnostic')
  const [team, setTeam] = useState<'All' | Team>('All')
  const [line, setLine] = useState<Line2>('All')
  const [strategy, setStrategy] = useState<Strategy>('risk')
  const [rate, setRate] = useState(40)
  const [method, setMethod] = useState<Method>('specialty')
  const [autoRoute, setAutoRoute] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ran, setRan] = useState(0)

  // reviewer pool, scoped to team when chosen
  const pool = useMemo(() => {
    const all = assignableReviewers(users)
    if (team === 'All') return all
    const scoped = all.filter((u) => u.team === team)
    return scoped.length ? scoped : all
  }, [users, team])

  // population split by review type
  const closed = useMemo(() => POPULATION.filter((p) => p.status === 'Closed'), [])
  const open = useMemo(() => POPULATION.filter((p) => p.status === 'Open'), [])
  const cohortCount = (rows: typeof POPULATION) =>
    rows.filter((p) => (team === 'All' || p.team === team) && (line === 'All' || p.line === line)).length
  const diagnosticBacklog = cohortCount(closed)
  const targetedInFlight = cohortCount(open)

  // the file rows for the active cohort
  const rows: FileRow[] = useMemo(() => {
    if (reviewType === 'Diagnostic') {
      // real settled, ready-to-review files (clickable end-to-end)
      return reviewClaims
        .filter((c) => line === 'All' || c.line === line)
        .map((c) => ({ id: c.id, claimNumber: c.claimNumber, line: c.line, peril: c.perilType, severity: c.severity, reserve: c.reserveAmount, team: '—', flags: [], real: true }))
    }
    // open, in-flight files from the population
    return open
      .filter((p) => (team === 'All' || p.team === team) && (line === 'All' || p.line === line))
      .slice(0, 80)
      .map((p) => ({ id: p.id, claimNumber: p.claimNumber, line: p.line, peril: p.peril, severity: p.severity, reserve: p.reserve, team: p.team, flags: p.flags, real: false }))
  }, [reviewType, reviewClaims, open, team, line])

  function applyStrategy() {
    let ids: string[]
    if (strategy === 'full') ids = rows.map((r) => r.id)
    else {
      const count = Math.max(1, Math.ceil((rows.length * rate) / 100))
      if (strategy === 'random') ids = rows.slice(0, count).map((r) => r.id)
      else {
        const ranked = [...rows].sort((a, b) => SEV_RANK[b.severity] + b.flags.length * 2 - (SEV_RANK[a.severity] + a.flags.length * 2))
        ids = ranked.slice(0, count).map((r) => r.id)
      }
    }
    setSelected(new Set(ids))
  }
  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function assign() {
    const files = rows.filter((r) => selected.has(r.id)).map((r) => ({ id: r.id, line: r.line, peril: r.peril }))
    const n = assignFiles(files, { reviewType, method, reviewers: pool.map((u) => u.name), autoRoute })
    setRan(n)
  }

  const dist = useMemo(() => {
    const m: Record<string, number> = {}
    Object.values(assignments).forEach((a) => {
      if (a.reviewType === reviewType) m[a.reviewer] = (m[a.reviewer] || 0) + 1
    })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [assignments, reviewType])

  const selectedCount = selected.size
  const coverage = rows.length ? Math.round((selectedCount / rows.length) * 100) : 0

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Sampling & Assignment"
          subtitle="Split the book into Diagnostic (outcome-based) and Targeted (real-time) cohorts, pick files, and assign them."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Users2 size={16} className="text-brand-500" />
              <span className="font-semibold text-brand-950">{pool.length}</span> reviewers in pool
            </div>
          }
        />

        {/* cohort split */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <CohortCard active={reviewType === 'Diagnostic'} onClick={() => { setReviewType('Diagnostic'); setSelected(new Set()) }} icon={Clock} title="Diagnostic" sub="Outcome-based · closed claims" count={diagnosticBacklog} note="settled-claim backlog" />
          <CohortCard active={reviewType === 'Targeted'} onClick={() => { setReviewType('Targeted'); setSelected(new Set()) }} icon={Activity} title="Targeted" sub="Real-time · open claims" count={targetedInFlight} note="open claims in-flight" violet />
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            {/* filters + strategy */}
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <FilterGroup label="Team" options={['All', ...TEAMS] as ('All' | Team)[]} value={team} onChange={(v) => { setTeam(v); setSelected(new Set()) }} />
                <FilterGroup label="Line" options={['All', 'Property', 'Auto', 'Casualty'] as Line2[]} value={line} onChange={(v) => { setLine(v); setSelected(new Set()) }} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-brand-50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-1">Sample</span>
                {STRATEGIES.map((s) => {
                  const Icon = s.icon
                  return (
                    <button key={s.id} onClick={() => setStrategy(s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${strategy === s.id ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-brand-100 text-slate-500 hover:text-brand-700'}`}>
                      <Icon size={13} /> {s.title}
                    </button>
                  )
                })}
                {strategy !== 'full' && (
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    <input type="range" min={5} max={100} step={5} value={rate} onChange={(e) => setRate(parseInt(e.target.value))} className="w-28 accent-brand-600" />
                    <span className="font-semibold text-brand-700 w-8 tabular-nums">{rate}%</span>
                  </span>
                )}
                <button onClick={applyStrategy} className="ml-auto text-xs font-semibold text-brand-700 border border-brand-100 rounded-lg px-3 py-1.5 hover:bg-brand-50">
                  Select sample
                </button>
              </div>
            </Card>

            {/* file list */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-brand-50">
                <div className="text-sm font-bold text-brand-950">
                  {reviewType} files <span className="text-slate-400 font-medium">· {rows.length} shown</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button onClick={() => setSelected(new Set(rows.map((r) => r.id)))} className="font-semibold text-slate-500 hover:text-brand-700">Select all</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => setSelected(new Set())} className="font-semibold text-slate-500 hover:text-brand-700">Clear</button>
                </div>
              </div>
              <div className="max-h-[420px] overflow-auto divide-y divide-brand-50">
                {rows.map((r) => {
                  const on = selected.has(r.id)
                  return (
                    <button key={r.id} onClick={() => toggle(r.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${on ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}>
                      <span className={`w-4 h-4 rounded border grid place-items-center shrink-0 ${on ? 'bg-brand-600 border-brand-600' : 'border-slate-300'}`}>
                        {on && <Check size={11} className="text-white" />}
                      </span>
                      <span className="font-semibold text-brand-950 text-sm w-28 shrink-0">{r.claimNumber}</span>
                      <LinePill line={r.line} />
                      <span className="text-xs text-slate-500 flex-1 min-w-0 truncate">{r.peril}</span>
                      {r.flags.map((f) => (
                        <span key={f} className="hidden md:flex items-center gap-1 text-[10px] font-semibold text-accent-600 bg-accent-50 rounded px-1.5 py-0.5" style={{ background: '#fff1e6' }}>
                          <AlertTriangle size={9} /> {f}
                        </span>
                      ))}
                      <SeverityChip severity={r.severity} />
                      <span className="text-xs text-slate-500 w-20 text-right tabular-nums hidden sm:block">{currency(r.reserve)}</span>
                    </button>
                  )
                })}
                {rows.length === 0 && <div className="px-4 py-10 text-center text-sm text-slate-400">No files in this cohort for the current filters.</div>}
              </div>
            </Card>
          </div>

          {/* assign rail */}
          <div className="lg:sticky lg:top-6 h-fit space-y-4">
            <Card className="p-5 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-0">
              <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-wide">
                {reviewType === 'Targeted' ? <Activity size={14} /> : <Clock size={14} />} {reviewType} selection
              </div>
              <div className="mt-3 text-4xl font-extrabold tabular-nums">{selectedCount}</div>
              <div className="text-sm text-brand-100/70">files selected ({coverage}% of shown)</div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-100/60 mb-1.5">Assignment method</div>
                <div className="flex flex-wrap gap-1.5">
                  {METHODS.map((m) => (
                    <button key={m.id} onClick={() => setMethod(m.id)} className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${method === m.id ? 'bg-white text-brand-800' : 'bg-white/10 text-brand-100/80 hover:bg-white/20'}`}>
                      {m.title}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setAutoRoute((a) => !a)} className="mt-4 w-full flex items-center justify-between gap-2 text-left">
                <span className="text-xs text-brand-100/80">
                  Route by Assignment Rules <span className="text-brand-100/50">(team + form per rule)</span>
                </span>
                <span className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${autoRoute ? 'bg-accent-500' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoRoute ? 'left-4' : 'left-0.5'}`} />
                </span>
              </button>

              <button onClick={assign} disabled={selectedCount === 0} className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all ${selectedCount ? 'bg-accent-500 hover:bg-accent-600 text-white shadow-glow' : 'bg-white/10 text-brand-100/50 cursor-not-allowed'}`}>
                <Play size={15} /> Assign {selectedCount} files
              </button>
              {ran > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300 font-semibold">
                  <Check size={15} /> Assigned {ran} {reviewType} files.
                </div>
              )}
            </Card>

            {dist.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{reviewType} distribution</div>
                  <button onClick={clearAssignments} className="text-[11px] font-semibold text-slate-400 hover:text-red-500">Clear</button>
                </div>
                {dist.map(([name, n]) => (
                  <div key={name} className="flex items-center gap-2 text-sm py-0.5">
                    <span className="text-slate-600 flex-1">{name}</span>
                    <span className="font-semibold text-brand-950 tabular-nums">{n}</span>
                  </div>
                ))}
                <button onClick={() => navigate('/queue')} className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-700 border border-brand-100 rounded-lg py-2 hover:bg-brand-50">
                  Open queue <ArrowRight size={15} />
                </button>
              </Card>
            )}

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Cohort coverage</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={[{ name: 'Selected', value: selectedCount }, { name: 'Rest', value: Math.max(0, rows.length - selectedCount) }]} dataKey="value" innerRadius={40} outerRadius={58} paddingAngle={2} stroke="none">
                    <Cell fill="#2f6df6" />
                    <Cell fill="#e8eef9" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center -mt-[92px] mb-[56px] pointer-events-none">
                <div className="text-xl font-extrabold text-brand-950 tabular-nums">{coverage}%</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function CohortCard({ active, onClick, icon: Icon, title, sub, count, note, violet }: { active: boolean; onClick: () => void; icon: any; title: string; sub: string; count: number; note: string; violet?: boolean }) {
  return (
    <button onClick={onClick} className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${active ? 'border-brand-500 bg-brand-50/60 shadow-glow' : 'border-brand-100 bg-white hover:border-brand-300'}`}>
      <div className={`w-11 h-11 rounded-xl grid place-items-center ${active ? (violet ? 'bg-violet-600 text-white' : 'bg-brand-600 text-white') : 'bg-brand-50 text-brand-600'}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="font-bold text-brand-950">{title} <span className="text-slate-400 font-medium text-sm">· {sub}</span></div>
        <div className="text-2xl font-extrabold text-brand-950 tabular-nums mt-0.5">{count.toLocaleString()}</div>
        <div className="text-[11px] text-slate-400">{note}</div>
      </div>
    </button>
  )
}

function FilterGroup<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mr-0.5">{label}</span>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${value === o ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-brand-100 text-slate-500 hover:text-brand-700'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}
