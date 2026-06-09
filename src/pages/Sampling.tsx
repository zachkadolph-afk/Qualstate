import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Filter, Shuffle, Layers, Target, Users2, Gauge, Clock, Activity, Play, Check, ArrowRight } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../lib/store'
import { assignableReviewers } from '../data/users'
import { ReviewType } from '../data/forms'

/* ------------------------------------------------------------------ */
/*  Sampling & Assignment — organized BY REVIEW TYPE. Pick the review  */
/*  mode, size the sample, then assign the live pending files to the   */
/*  real reviewer pool (writes assignments into the shared store →     */
/*  they appear in the Queue).                                          */
/* ------------------------------------------------------------------ */

type Strategy = 'full' | 'random' | 'risk'
type Assignment = 'round-robin' | 'specialty' | 'load-balanced'

const REVIEW_TYPES: { id: ReviewType; icon: any; title: string; sub: string }[] = [
  { id: 'Diagnostic', icon: Clock, title: 'Outcome-based', sub: 'Retrospective review of settled claims' },
  { id: 'Targeted', icon: Activity, title: 'Real-time', sub: 'In-flight review of open claims' },
]

const STRATEGIES: Record<ReviewType, { id: Strategy; icon: any; title: string; body: string }[]> = {
  Diagnostic: [
    { id: 'full', icon: Layers, title: 'Full population', body: 'Every settled claim gets an AI first-pass; reviewers validate a prioritized slice.' },
    { id: 'random', icon: Shuffle, title: 'Random sample', body: 'A statistically representative percentage for unbiased quality baselining.' },
    { id: 'risk', icon: Target, title: 'Risk-based', body: 'Weight toward high-severity, high-reserve, low-AI-confidence settled claims.' },
  ],
  Targeted: [
    { id: 'full', icon: Layers, title: 'All open claims', body: 'Score every in-flight claim continuously as it moves through adjusting.' },
    { id: 'random', icon: Shuffle, title: 'Spot-check', body: 'A random slice of open claims for a real-time pulse on quality.' },
    { id: 'risk', icon: Target, title: 'Risk triggers', body: 'Target open claims hitting triggers: large loss, litigation, reserve change, SIU.' },
  ],
}

const ASSIGNMENTS: { id: Assignment; title: string; body: string }[] = [
  { id: 'round-robin', title: 'Round-robin', body: 'Even rotation across the reviewer pool.' },
  { id: 'specialty', title: 'By line specialty', body: 'Route Property/Auto/Casualty to specialists.' },
  { id: 'load-balanced', title: 'Load-balanced', body: 'Fill to capacity, lowest queue first.' },
]

export default function Sampling() {
  const navigate = useNavigate()
  const { reviewClaims, users, assignments, runAssignment, clearAssignments } = useStore()

  const [reviewType, setReviewType] = useState<ReviewType>('Diagnostic')
  const [strategy, setStrategy] = useState<Strategy>('risk')
  const [assignment, setAssignment] = useState<Assignment>('specialty')
  const [monthlyVolume, setMonthlyVolume] = useState(reviewType === 'Diagnostic' ? 4200 : 9000)
  const [sampleRate, setSampleRate] = useState(8)
  const [riskFocus, setRiskFocus] = useState(60)
  const [capacityPerReviewer, setCapacityPerReviewer] = useState(60)
  const [ran, setRan] = useState(0)

  const pool = useMemo(() => assignableReviewers(users), [users])
  const reviewers = pool.length

  const preview = useMemo(() => {
    let selected: number
    if (strategy === 'full') selected = monthlyVolume
    else if (strategy === 'random') selected = Math.round((monthlyVolume * sampleRate) / 100)
    else selected = Math.round(monthlyVolume * (0.05 + (riskFocus / 100) * 0.12))
    const capacity = reviewers * capacityPerReviewer
    const coverage = monthlyVolume ? Math.round((selected / monthlyVolume) * 100) : 0
    const utilization = capacity ? Math.min(100, Math.round((selected / capacity) * 100)) : 0
    const backlog = Math.max(0, selected - capacity)
    return { selected, capacity, coverage, utilization, backlog }
  }, [strategy, monthlyVolume, sampleRate, riskFocus, reviewers, capacityPerReviewer])

  // live assignment distribution for the chosen review type
  const dist = useMemo(() => {
    const m: Record<string, number> = {}
    Object.values(assignments).forEach((a) => {
      if (a.reviewType === reviewType) m[a.reviewer] = (m[a.reviewer] || 0) + 1
    })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [assignments, reviewType])
  const assignedCount = dist.reduce((s, [, n]) => s + n, 0)

  function run() {
    const n = runAssignment({ reviewType, method: assignment })
    setRan(n)
  }

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="Sampling & Assignment"
          subtitle="Choose a review type, size the sample, and assign live files to your reviewer pool."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Users2 size={16} className="text-brand-500" />
              <span className="font-semibold text-brand-950">{reviewers}</span> assignable reviewers
            </div>
          }
        />

        {/* review type selector */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {REVIEW_TYPES.map((rt) => {
            const Icon = rt.icon
            const active = reviewType === rt.id
            return (
              <button
                key={rt.id}
                onClick={() => setReviewType(rt.id)}
                className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${active ? 'border-brand-500 bg-brand-50/60 shadow-glow' : 'border-brand-100 bg-white hover:border-brand-300'}`}
              >
                <div className={`w-10 h-10 rounded-xl grid place-items-center ${active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
                  <Icon size={19} />
                </div>
                <div>
                  <div className="font-bold text-brand-950 text-sm">
                    {rt.title} <span className="text-slate-400 font-medium">· {rt.id}</span>
                  </div>
                  <div className="text-xs text-slate-500">{rt.sub}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* config column */}
          <div className="space-y-5">
            <div>
              <SectionLabel n={1} title={`Sampling strategy — ${reviewType}`} />
              <div className="grid sm:grid-cols-3 gap-3">
                {STRATEGIES[reviewType].map((s) => {
                  const Icon = s.icon
                  const active = strategy === s.id
                  return (
                    <button key={s.id} onClick={() => setStrategy(s.id)} className={`text-left p-4 rounded-2xl border transition-all ${active ? 'border-brand-500 bg-brand-50/60 shadow-glow' : 'border-brand-100 bg-white hover:border-brand-300'}`}>
                      <div className={`w-9 h-9 rounded-xl grid place-items-center ${active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="mt-2.5 font-bold text-brand-950 text-sm">{s.title}</div>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">{s.body}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <Card className="p-5">
              <SectionLabel n={2} title="Parameters" inline />
              <div className="space-y-5 mt-3">
                <Slider label={reviewType === 'Diagnostic' ? 'Monthly settled volume' : 'Open claims in-flight'} value={monthlyVolume} min={500} max={1000000} step={500} suffix=" claims" onChange={setMonthlyVolume} />
                {strategy === 'random' && <Slider label="Sample rate" value={sampleRate} min={1} max={100} step={1} suffix="%" onChange={setSampleRate} />}
                {strategy === 'risk' && <Slider label="Risk focus intensity" value={riskFocus} min={0} max={100} step={5} suffix="%" onChange={setRiskFocus} hint="Higher = more weight on severity, reserve size, and low AI confidence" />}
                <Slider label="Capacity / reviewer" value={capacityPerReviewer} min={20} max={400} step={10} suffix="/mo" onChange={setCapacityPerReviewer} />
              </div>
            </Card>

            <div>
              <SectionLabel n={3} title="Assignment method" />
              <div className="grid sm:grid-cols-3 gap-3">
                {ASSIGNMENTS.map((a) => {
                  const active = assignment === a.id
                  return (
                    <button key={a.id} onClick={() => setAssignment(a.id)} className={`text-left p-4 rounded-2xl border transition-all ${active ? 'border-brand-500 bg-brand-50/60 shadow-glow' : 'border-brand-100 bg-white hover:border-brand-300'}`}>
                      <div className="font-bold text-brand-950 text-sm">{a.title}</div>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">{a.body}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* live run against the actual queue */}
            <Card className="p-5">
              <SectionLabel n={4} title="Assign live files" inline />
              <p className="text-sm text-slate-500 mt-2">
                <span className="font-semibold text-brand-950">{reviewClaims.length}</span> files are pending in the queue.
                Assign them as <span className="font-semibold text-brand-950">{reviewType}</span> reviews across{' '}
                <span className="font-semibold text-brand-950">{reviewers}</span> reviewers using{' '}
                <span className="font-semibold text-brand-950">{ASSIGNMENTS.find((a) => a.id === assignment)!.title.toLowerCase()}</span>.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button onClick={run} className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow">
                  <Play size={15} /> Assign {reviewClaims.length} files
                </button>
                {assignedCount > 0 && (
                  <>
                    <button onClick={() => navigate('/queue')} className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 px-3 py-2.5 rounded-xl border border-brand-100 bg-white">
                      Open queue <ArrowRight size={15} />
                    </button>
                    <button onClick={clearAssignments} className="text-sm font-semibold text-slate-400 hover:text-red-500 px-3 py-2.5">Clear</button>
                  </>
                )}
              </div>
              {ran > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                  <Check size={15} /> Assigned {ran} files as {reviewType} reviews.
                </div>
              )}
              {dist.length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-50 space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Distribution</div>
                  {dist.map(([name, n]) => (
                    <div key={name} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600 flex-1">{name}</span>
                      <span className="font-semibold text-brand-950 tabular-nums">{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* preview rail */}
          <div className="lg:sticky lg:top-6 h-fit space-y-4">
            <Card className="p-5 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-0">
              <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-wide">
                <Gauge size={14} /> {reviewType} plan
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold tabular-nums">{preview.selected.toLocaleString()}</div>
                <div className="text-sm text-brand-100/70">claims selected / month</div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm">
                <RailRow icon={Filter} label="Population coverage" value={`${preview.coverage}%`} />
                <RailRow icon={Users2} label="Reviewer pool" value={`${reviewers}`} />
                <RailRow icon={Gauge} label="Capacity utilization" value={`${preview.utilization}%`} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Population coverage</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={[{ name: 'Reviewed', value: preview.selected }, { name: 'Not reviewed', value: Math.max(0, monthlyVolume - preview.selected) }]} dataKey="value" nameKey="name" innerRadius={44} outerRadius={64} paddingAngle={2} stroke="none">
                    <Cell fill="#2f6df6" />
                    <Cell fill="#e8eef9" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center -mt-[96px] mb-[60px] pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-brand-950 tabular-nums">{preview.coverage}%</div>
                  <div className="text-[11px] text-slate-400">of population</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#2f6df6' }} /> Reviewed</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#e8eef9' }} /> Rest of book</span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Capacity check</div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${preview.utilization >= 100 ? 'bg-red-500' : preview.utilization >= 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${preview.utilization}%` }} />
              </div>
              <p className="text-xs mt-2 leading-relaxed">
                {preview.backlog > 0 ? (
                  <span className="text-red-600 font-semibold">{preview.backlog.toLocaleString()} claims/month over capacity — add reviewers or tighten the sample.</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Within capacity — the selected volume fits your pool.</span>
                )}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ n, title, inline }: { n: number; title: string; inline?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${inline ? '' : 'mb-3'}`}>
      <div className="w-6 h-6 rounded-lg bg-brand-600 text-white grid place-items-center font-extrabold text-xs">{n}</div>
      <h2 className="font-bold text-brand-950 text-sm">{title}</h2>
    </div>
  )
}

function Slider({ label, value, min, max, step, suffix, hint, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; hint?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-brand-950">{label}</label>
        <span className="text-sm font-bold text-brand-700 tabular-nums">{value.toLocaleString()}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="mt-2 w-full accent-brand-600" />
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function RailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="text-brand-200" />
      <span className="text-brand-100/80 flex-1">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  )
}
