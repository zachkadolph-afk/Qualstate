import { useMemo } from 'react'
import { GraduationCap, AlertTriangle, Scale, Check } from 'lucide-react'
import { Card, PageHeader, LinePill } from '../components/ui'
import { useStore } from '../lib/store'
import { CoachingKind, CoachingStatus } from '../data/coaching'

/* ------------------------------------------------------------------ */
/*  Coaching & Disputes — turn a quality finding into action: coach a  */
/*  team on a weak claim type, or dispute a score. The operational      */
/*  loop that closes quality reviews. Visible to all roles.            */
/* ------------------------------------------------------------------ */

const basePeril = (p: string) => p.split('—')[0].trim()

const KIND_STYLE: Record<CoachingKind, string> = {
  Coaching: 'bg-sky-50 text-sky-700 border-sky-200',
  Dispute: 'bg-orange-50 text-orange-700 border-orange-200',
}
const STATUS_STYLE: Record<CoachingStatus, string> = {
  Open: 'bg-amber-50 text-amber-700',
  Acknowledged: 'bg-brand-50 text-brand-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
}
const STATUSES: CoachingStatus[] = ['Open', 'Acknowledged', 'Resolved']

export default function Coaching() {
  const { coaching, addCoaching, updateCoaching, completedReviews, getClaim } = useStore()

  // flagged = below-standard completed reviews (quality < 70), de-duped by claim
  const flagged = useMemo(() => {
    const seen = new Set<string>()
    const open = new Set(coaching.map((c) => c.claimNumber))
    const out: { claimId: string; claimNumber: string; claimType: string; line: any; score: number }[] = []
    for (const r of completedReviews) {
      if (r.qualityScore >= 70) continue
      if (seen.has(r.claimId)) continue
      const c = getClaim(r.claimId)
      if (!c) continue
      seen.add(r.claimId)
      if (open.has(c.claimNumber)) continue
      out.push({ claimId: r.claimId, claimNumber: c.claimNumber, claimType: `${c.line} · ${basePeril(c.perilType)}`, line: c.line, score: r.qualityScore })
      if (out.length >= 10) break
    }
    return out
  }, [completedReviews, getClaim, coaching])

  function create(f: (typeof flagged)[number], kind: CoachingKind) {
    addCoaching({
      claimId: f.claimId,
      claimNumber: f.claimNumber,
      claimType: f.claimType,
      kind,
      status: 'Open',
      note: kind === 'Dispute' ? 'Score disputed — pending review.' : 'Coaching opportunity identified on this claim type.',
      team: '—',
    })
  }

  const openCount = coaching.filter((c) => c.status !== 'Resolved').length

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="Coaching & Disputes"
          subtitle="Act on quality findings — coach a team or dispute a score, and track it to resolution."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <GraduationCap size={16} className="text-brand-500" />
              <span className="font-semibold text-brand-950">{openCount}</span> open
            </div>
          }
        />

        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          {/* flagged feed */}
          <div>
            <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm mb-3">
              <AlertTriangle size={15} /> Flagged reviews (below standard)
            </div>
            <div className="space-y-2.5">
              {flagged.map((f) => (
                <Card key={f.claimId} className="p-3.5">
                  <div className="flex items-center gap-2">
                    <LinePill line={f.line} />
                    <span className="text-sm font-semibold text-brand-950">{f.claimNumber}</span>
                    <span className="ml-auto text-sm font-bold px-2 py-0.5 rounded-md tabular-nums bg-red-50 text-red-700">{f.score}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{f.claimType}</div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button onClick={() => create(f, 'Coaching')} className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 border border-sky-200 rounded-lg px-2.5 py-1.5 hover:bg-sky-50">
                      <GraduationCap size={13} /> Coach
                    </button>
                    <button onClick={() => create(f, 'Dispute')} className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 border border-orange-200 rounded-lg px-2.5 py-1.5 hover:bg-orange-50">
                      <Scale size={13} /> Dispute
                    </button>
                  </div>
                </Card>
              ))}
              {flagged.length === 0 && <Card className="p-6 text-center text-sm text-slate-400">No new below-standard reviews to action.</Card>}
            </div>
          </div>

          {/* tracked items */}
          <div>
            <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm mb-3">
              <GraduationCap size={15} /> Tracked items
            </div>
            <div className="space-y-3">
              {coaching.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${KIND_STYLE[c.kind]}`}>{c.kind}</span>
                    <span className="text-sm font-semibold text-brand-950">{c.claimNumber}</span>
                    <span className="text-xs text-slate-400">{c.claimType}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                      <select value={c.status} onChange={(e) => updateCoaching(c.id, { status: e.target.value as CoachingStatus })} className="text-xs rounded-md border border-brand-100 px-2 py-1 focus:outline-none cursor-pointer">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.note}</p>
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
                    <span>{c.createdBy}</span>·<span>{c.createdAt}</span>
                    {c.team !== '—' && <><span>·</span><span>{c.team}</span></>}
                    {c.status === 'Resolved' && <span className="flex items-center gap-1 text-emerald-600 font-semibold ml-1"><Check size={12} /> closed</span>}
                  </div>
                </Card>
              ))}
              {coaching.length === 0 && <Card className="p-10 text-center text-sm text-slate-400">No coaching items or disputes yet. Action a flagged review to start.</Card>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
