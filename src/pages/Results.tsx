import { useState } from 'react'
import { Sparkles, UserCheck } from 'lucide-react'
import Scorecards from './Scorecards'
import Calibration from './Calibration'

/* ------------------------------------------------------------------ */
/*  Results — one page, two lenses on the same outcomes:               */
/*    Agentic = the AI first-pass results (model reliability)          */
/*    Human   = the reviewer-validated results (claim-type health)     */
/*  Completed reviews are surfaced within each lens (recent lists).    */
/* ------------------------------------------------------------------ */

type Lens = 'human' | 'agentic'

const TABS: { id: Lens; icon: any; label: string; sub: string }[] = [
  { id: 'human', icon: UserCheck, label: 'Human results', sub: 'Reviewer-validated' },
  { id: 'agentic', icon: Sparkles, label: 'Agentic results', sub: 'AI first-pass' },
]

export default function Results() {
  const [lens, setLens] = useState<Lens>('human')

  return (
    <div className="min-h-screen">
      {/* lens switch */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center gap-4 flex-wrap">
          <span className="font-extrabold text-brand-950">Results</span>
          <div className="flex bg-slate-100 rounded-xl p-1">
            {TABS.map((t) => {
              const Icon = t.icon
              const active = lens === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setLens(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-white text-brand-700 shadow-card' : 'text-slate-500 hover:text-brand-700'}`}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                  <span className="hidden sm:inline text-[11px] font-medium text-slate-400">· {t.sub}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {lens === 'human' ? <Scorecards /> : <Calibration />}
    </div>
  )
}
