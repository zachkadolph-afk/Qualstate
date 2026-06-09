import { useMemo, useState } from 'react'
import { Filter, Shuffle, Layers, Target, Users2, Gauge } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'

/* ------------------------------------------------------------------ */
/*  Sampling & Assignment — interactive configurator, local state only.*/
/*  Computes a live preview from the inputs; touches nothing shared.   */
/* ------------------------------------------------------------------ */

type Strategy = 'full' | 'random' | 'risk'
type Assignment = 'round-robin' | 'specialty' | 'load-balanced'

const STRATEGIES: { id: Strategy; icon: any; title: string; body: string }[] = [
  { id: 'full', icon: Layers, title: 'Full population', body: 'Every settled claim gets an AI first-pass; reviewers validate a prioritized slice.' },
  { id: 'random', icon: Shuffle, title: 'Random sample', body: 'A statistically representative percentage, suitable for unbiased quality baselining.' },
  { id: 'risk', icon: Target, title: 'Risk-based targeting', body: 'Weight selection toward high-severity, high-reserve, and low-AI-confidence claims.' },
]

const ASSIGNMENTS: { id: Assignment; title: string; body: string }[] = [
  { id: 'round-robin', title: 'Round-robin', body: 'Even rotation across the reviewer pool.' },
  { id: 'specialty', title: 'By line specialty', body: 'Route Property/Auto/Casualty to specialists.' },
  { id: 'load-balanced', title: 'Load-balanced', body: 'Fill to capacity, lowest queue first.' },
]

export default function Sampling() {
  const [strategy, setStrategy] = useState<Strategy>('risk')
  const [assignment, setAssignment] = useState<Assignment>('specialty')
  const [monthlyVolume, setMonthlyVolume] = useState(4200)
  const [sampleRate, setSampleRate] = useState(8) // % for random
  const [riskFocus, setRiskFocus] = useState(60) // % bias toward risky for risk-based
  const [reviewers, setReviewers] = useState(6)
  const [capacityPerReviewer, setCapacityPerReviewer] = useState(60) // claims/reviewer/month

  const preview = useMemo(() => {
    let selected: number
    if (strategy === 'full') selected = monthlyVolume
    else if (strategy === 'random') selected = Math.round((monthlyVolume * sampleRate) / 100)
    else {
      // risk-based: a smaller, focused slice that scales with focus intensity
      const base = 0.05 + (riskFocus / 100) * 0.12 // 5%–17%
      selected = Math.round(monthlyVolume * base)
    }
    const capacity = reviewers * capacityPerReviewer
    const reviewable = Math.min(selected, capacity)
    const perReviewer = reviewers ? Math.round(reviewable / reviewers) : 0
    const coverage = monthlyVolume ? Math.round((selected / monthlyVolume) * 100) : 0
    const utilization = capacity ? Math.min(100, Math.round((selected / capacity) * 100)) : 0
    const backlog = Math.max(0, selected - capacity)
    return { selected, capacity, reviewable, perReviewer, coverage, utilization, backlog }
  }, [strategy, monthlyVolume, sampleRate, riskFocus, reviewers, capacityPerReviewer])

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="Sampling & Assignment"
          subtitle="Decide which claims get reviewed and how they're routed to your reviewer pool."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Filter size={16} className="text-brand-500" />
              {preview.coverage}% population coverage
            </div>
          }
        />

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* config column */}
          <div className="space-y-5">
            {/* strategy */}
            <div>
              <SectionLabel n={1} title="Sampling strategy" />
              <div className="grid sm:grid-cols-3 gap-3">
                {STRATEGIES.map((s) => {
                  const Icon = s.icon
                  const active = strategy === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        active ? 'border-brand-500 bg-brand-50/60 shadow-glow' : 'border-brand-100 bg-white hover:border-brand-300'
                      }`}
                    >
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

            {/* parameters */}
            <Card className="p-5">
              <SectionLabel n={2} title="Parameters" inline />
              <div className="space-y-5 mt-3">
                <Slider label="Monthly claim volume" value={monthlyVolume} min={500} max={12000} step={100} suffix=" claims" onChange={setMonthlyVolume} />
                {strategy === 'random' && (
                  <Slider label="Sample rate" value={sampleRate} min={1} max={100} step={1} suffix="%" onChange={setSampleRate} />
                )}
                {strategy === 'risk' && (
                  <Slider label="Risk focus intensity" value={riskFocus} min={0} max={100} step={5} suffix="%" onChange={setRiskFocus} hint="Higher = more weight on severity, reserve size, and low AI confidence" />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Slider label="Reviewers" value={reviewers} min={1} max={30} step={1} suffix="" onChange={setReviewers} />
                  <Slider label="Capacity / reviewer" value={capacityPerReviewer} min={20} max={160} step={5} suffix="/mo" onChange={setCapacityPerReviewer} />
                </div>
              </div>
            </Card>

            {/* assignment */}
            <div>
              <SectionLabel n={3} title="Assignment method" />
              <div className="grid sm:grid-cols-3 gap-3">
                {ASSIGNMENTS.map((a) => {
                  const active = assignment === a.id
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAssignment(a.id)}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        active ? 'border-brand-500 bg-brand-50/60 shadow-glow' : 'border-brand-100 bg-white hover:border-brand-300'
                      }`}
                    >
                      <div className="font-bold text-brand-950 text-sm">{a.title}</div>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">{a.body}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* live preview rail */}
          <div className="lg:sticky lg:top-6 h-fit space-y-4">
            <Card className="p-5 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-0">
              <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-wide">
                <Gauge size={14} /> Live preview
              </div>
              <div className="mt-4">
                <div className="text-4xl font-extrabold tabular-nums">{preview.selected.toLocaleString()}</div>
                <div className="text-sm text-brand-100/70">claims selected for review / month</div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm">
                <RailRow icon={Filter} label="Population coverage" value={`${preview.coverage}%`} />
                <RailRow icon={Users2} label="Per reviewer / month" value={`${preview.perReviewer}`} />
                <RailRow icon={Gauge} label="Capacity utilization" value={`${preview.utilization}%`} />
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Capacity check</div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${preview.utilization >= 100 ? 'bg-red-500' : preview.utilization >= 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${preview.utilization}%` }}
                />
              </div>
              <p className="text-xs mt-2 leading-relaxed text-slate-500">
                {preview.backlog > 0 ? (
                  <span className="text-red-600 font-semibold">
                    {preview.backlog.toLocaleString()} claims/month over capacity — add reviewers or tighten the sample.
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Within capacity — the selected volume fits your pool.</span>
                )}
              </p>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Configured plan</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-semibold text-brand-950">{STRATEGIES.find((s) => s.id === strategy)!.title}</span> sampling,
                routed <span className="font-semibold text-brand-950">{ASSIGNMENTS.find((a) => a.id === assignment)!.title.toLowerCase()}</span> across{' '}
                <span className="font-semibold text-brand-950">{reviewers}</span> reviewers.
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

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  hint,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  hint?: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-brand-950">{label}</label>
        <span className="text-sm font-bold text-brand-700 tabular-nums">
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full accent-brand-600"
      />
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
