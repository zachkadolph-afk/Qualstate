import { useMemo, useState } from 'react'
import { Sparkles, UserCheck, SlidersHorizontal, RotateCcw } from 'lucide-react'
import Scorecards from './Scorecards'
import Calibration from './Calibration'
import { useStore } from '../lib/store'
import { TEAMS, Team } from '../data/users'
import { Line } from '../data/types'
import { Scope, defaultScopeFor, basePeril } from '../lib/scope'

/* ------------------------------------------------------------------ */
/*  Results — one page, two lenses (Agentic / Human) over the same     */
/*  outcomes, with claim-type filters prefilled from the user's role.  */
/* ------------------------------------------------------------------ */

type Lens = 'human' | 'agentic'

const TABS: { id: Lens; icon: any; label: string; sub: string }[] = [
  { id: 'human', icon: UserCheck, label: 'Human results', sub: 'Reviewer-validated' },
  { id: 'agentic', icon: Sparkles, label: 'Agentic results', sub: 'AI first-pass' },
]
const LINES: ('All' | Line)[] = ['All', 'Property', 'Auto', 'Casualty']

export default function Results() {
  const { currentUser, completedReviews, getClaim } = useStore()
  const [lens, setLens] = useState<Lens>('human')
  // prefill from the signed-in user's team/line
  const [scope, setScope] = useState<Scope>(() => defaultScopeFor(currentUser))

  // option lists derived from the data (perils + states present, honoring line)
  const { perils, states } = useMemo(() => {
    const ps = new Set<string>()
    const ss = new Set<string>()
    for (const r of completedReviews) {
      const c = getClaim(r.claimId)
      if (!c) continue
      if (scope.line === 'All' || c.line === scope.line) ps.add(basePeril(c.perilType))
      ss.add(c.state)
    }
    return { perils: ['All', ...Array.from(ps).sort()], states: ['All', ...Array.from(ss).sort()] }
  }, [completedReviews, getClaim, scope.line])

  const set = (patch: Partial<Scope>) => setScope((s) => ({ ...s, ...patch }))
  const isScoped = scope.line !== 'All' || scope.peril !== 'All' || scope.team !== 'All' || scope.state !== 'All'

  return (
    <div className="min-h-screen">
      {/* sticky filter + lens bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-8 py-3 space-y-2.5">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-extrabold text-brand-950">Results</span>
            <div className="flex bg-slate-100 rounded-xl p-1">
              {TABS.map((t) => {
                const Icon = t.icon
                const active = lens === t.id
                return (
                  <button key={t.id} onClick={() => setLens(t.id)} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-white text-brand-700 shadow-card' : 'text-slate-500 hover:text-brand-700'}`}>
                    <Icon size={15} />
                    <span>{t.label}</span>
                    <span className="hidden sm:inline text-[11px] font-medium text-slate-400">· {t.sub}</span>
                  </button>
                )
              })}
            </div>
            {currentUser?.team && currentUser.team !== '—' && (
              <span className="text-[11px] text-slate-400 hidden md:inline">prefilled for <span className="font-semibold text-slate-500">{currentUser.team}</span></span>
            )}
          </div>

          {/* claim-type filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <Filter label="Line" value={scope.line} options={LINES} onChange={(v) => set({ line: v as Scope['line'], peril: 'All' })} />
            <Filter label="Peril" value={scope.peril} options={perils} onChange={(v) => set({ peril: v })} />
            <Filter label="Team" value={scope.team} options={['All', ...TEAMS] as ('All' | Team)[]} onChange={(v) => set({ team: v as Scope['team'] })} />
            <Filter label="State" value={scope.state} options={states} onChange={(v) => set({ state: v })} />
            {isScoped && (
              <button onClick={() => setScope({ line: 'All', peril: 'All', team: 'All', state: 'All' })} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-brand-700 ml-1">
                <RotateCcw size={12} /> All claims
              </button>
            )}
          </div>
        </div>
      </div>

      {lens === 'human' ? <Scorecards scope={scope} /> : <Calibration scope={scope} />}
    </div>
  )
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer max-w-[160px]">
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}
