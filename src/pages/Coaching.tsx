import { useMemo, useState } from 'react'
import { MessageSquareQuote, Check, X, Sparkles, ThumbsUp, RefreshCw } from 'lucide-react'
import { Card, PageHeader, LinePill } from '../components/ui'
import { useStore } from '../lib/store'
import { CoachingKind, CoachingStatus } from '../data/coaching'
import { scoreBand } from '../lib/scoring'

/* ------------------------------------------------------------------ */
/*  Model Feedback — disseminated claim-quality results that users      */
/*  validate or rebut. The feedback is signal that improves the model,  */
/*  not employee coaching. Visible to all roles.                        */
/* ------------------------------------------------------------------ */

const basePeril = (p: string) => p.split('—')[0].trim()

const KIND_STYLE: Record<CoachingKind, string> = {
  Validation: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rebuttal: 'bg-orange-50 text-orange-700 border-orange-200',
}
const STATUS_STYLE: Record<CoachingStatus, string> = {
  Submitted: 'bg-amber-50 text-amber-700',
  Incorporated: 'bg-emerald-50 text-emerald-700',
  Dismissed: 'bg-slate-100 text-slate-500',
}
const STATUSES: CoachingStatus[] = ['Submitted', 'Incorporated', 'Dismissed']

export default function Coaching() {
  const { coaching, addCoaching, updateCoaching, completedReviews, getClaim } = useStore()
  const [rebutFor, setRebutFor] = useState<string | null>(null)
  const [rebutNote, setRebutNote] = useState('')

  // disseminated results awaiting feedback: notable completed reviews
  // (below-standard or low calibration), de-duped, excluding ones already given feedback.
  const results = useMemo(() => {
    const seen = new Set<string>()
    const done = new Set(coaching.map((c) => c.claimNumber))
    const out: { claimId: string; claimNumber: string; claimType: string; line: any; score: number; calibration: number }[] = []
    for (const r of completedReviews) {
      if (r.qualityScore >= 70 && r.calibration >= 80) continue
      if (seen.has(r.claimId)) continue
      const c = getClaim(r.claimId)
      if (!c) continue
      seen.add(r.claimId)
      if (done.has(c.claimNumber)) continue
      out.push({ claimId: r.claimId, claimNumber: c.claimNumber, claimType: `${c.line} · ${basePeril(c.perilType)}`, line: c.line, score: r.qualityScore, calibration: r.calibration })
      if (out.length >= 10) break
    }
    return out
  }, [completedReviews, getClaim, coaching])

  function validate(r: (typeof results)[number]) {
    addCoaching({ claimId: r.claimId, claimNumber: r.claimNumber, claimType: r.claimType, kind: 'Validation', status: 'Submitted', note: 'Confirmed the AI finding is correct.' })
  }
  function submitRebuttal(r: (typeof results)[number]) {
    addCoaching({ claimId: r.claimId, claimNumber: r.claimNumber, claimType: r.claimType, kind: 'Rebuttal', status: 'Submitted', note: rebutNote.trim() || 'Reviewer rebutted the AI finding.' })
    setRebutFor(null)
    setRebutNote('')
  }

  const validations = coaching.filter((c) => c.kind === 'Validation').length
  const rebuttals = coaching.filter((c) => c.kind === 'Rebuttal').length
  const incorporated = coaching.filter((c) => c.status === 'Incorporated').length

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Model Feedback"
          subtitle="Disseminated claim-quality results, validated or rebutted by reviewers — the signal that improves the model."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Sparkles size={16} className="text-accent-500" />
              <span className="font-semibold text-brand-950">{coaching.length}</span> feedback signals
            </div>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Kpi icon={ThumbsUp} label="Validations" value={`${validations}`} sub="AI confirmed correct" />
          <Kpi icon={MessageSquareQuote} label="Rebuttals" value={`${rebuttals}`} sub="AI corrected" orange />
          <Kpi icon={RefreshCw} label="Incorporated" value={`${incorporated}`} sub="fed to next model cycle" />
          <Kpi icon={Sparkles} label="Awaiting feedback" value={`${results.length}`} sub="disseminated results" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* disseminated results awaiting feedback */}
          <div>
            <h3 className="font-bold text-brand-950 mb-3 flex items-center gap-2"><Sparkles size={16} className="text-brand-600" /> Results for feedback</h3>
            <div className="space-y-3">
              {results.map((r) => {
                const band = scoreBand(r.score)
                const rebutting = rebutFor === r.claimId
                return (
                  <Card key={r.claimId} className="p-4">
                    <div className="flex items-center gap-3">
                      <LinePill line={r.line} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-brand-950">{r.claimNumber}</div>
                        <div className="text-xs text-slate-400">{r.claimType} · AI calibration {r.calibration}%</div>
                      </div>
                      <span className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums w-12 text-center" style={{ color: band.color, background: band.bg }}>{r.score}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button onClick={() => validate(r)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700">
                        <Check size={14} /> Validate
                      </button>
                      <button onClick={() => { setRebutFor(rebutting ? null : r.claimId); setRebutNote('') }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${rebutting ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-700'}`}>
                        <X size={14} /> Rebut
                      </button>
                      <span className="text-[11px] text-slate-400 ml-1">Feedback trains the model — it doesn't grade people.</span>
                    </div>
                    {rebutting && (
                      <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/50 p-3 animate-fadeup">
                        <textarea value={rebutNote} onChange={(e) => setRebutNote(e.target.value)} rows={2} placeholder="Why is the AI finding wrong? (this correction becomes training signal)" className="w-full text-sm rounded-lg border border-orange-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
                        <button onClick={() => submitRebuttal(r)} className="mt-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg">Submit rebuttal</button>
                      </div>
                    )}
                  </Card>
                )
              })}
              {results.length === 0 && (
                <Card className="p-10 text-center text-slate-400">
                  <Check size={36} className="mx-auto mb-2 text-emerald-400" />
                  <p className="font-semibold text-slate-600">All disseminated results have feedback.</p>
                </Card>
              )}
            </div>
          </div>

          {/* feedback signal log */}
          <div>
            <h3 className="font-bold text-brand-950 mb-3 flex items-center gap-2"><RefreshCw size={16} className="text-accent-500" /> Feedback signal</h3>
            <div className="space-y-3">
              {coaching.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${KIND_STYLE[c.kind]}`}>{c.kind}</span>
                    <span className="text-sm font-semibold text-brand-950">{c.claimNumber}</span>
                    <span className="text-xs text-slate-400">{c.claimType}</span>
                    <span className="ml-auto text-[11px] text-slate-400">{c.createdBy} · {c.createdAt}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.note}</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {STATUSES.map((s) => (
                      <button key={s} onClick={() => updateCoaching(c.id, { status: s })} className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${c.status === s ? STATUS_STYLE[s] : 'text-slate-400 hover:text-brand-700'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
              {coaching.length === 0 && <Card className="p-10 text-center text-sm text-slate-400">No feedback yet. Validate or rebut a result to start the signal.</Card>}
            </div>
          </div>
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
