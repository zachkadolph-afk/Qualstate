import { useMemo, useState } from 'react'
import { Activity, TrendingUp, Gauge, Layers, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, PageHeader, LinePill, ScoreRing } from '../components/ui'
import { scoreBand } from '../lib/scoring'
import { Line } from '../data/types'
import { Scope, ALL_SCOPE, inScope } from '../lib/scope'

/* ------------------------------------------------------------------ */
/*  Claim Type Health — organizational health by TYPE of claim, not by */
/*  person (many people touch a claim). "How are we doing on this type */
/*  of claim?" with a breakdown across claim types. Read-only.         */
/* ------------------------------------------------------------------ */

interface TypeAgg {
  key: string
  line: Line
  peril: string
  count: number
  sumQ: number
  sumCal: number
  q: Record<string, { agree: number; total: number; label: string }>
}

function basePeril(perilType: string): string {
  return perilType.split('—')[0].trim()
}

const LINE_COLORS: Record<string, string> = { Property: '#1c4fe0', Auto: '#10b981', Casualty: '#8b5cf6' }

export default function Scorecards({ scope = ALL_SCOPE }: { scope?: Scope }) {
  const { completedReviews, getClaim, users } = useStore()
  const [selected, setSelected] = useState<string | null>(null)

  const reviewerTeam = useMemo(() => {
    const m: Record<string, string> = {}
    users.forEach((u) => (m[u.name] = u.team))
    return m
  }, [users])

  const reviews = useMemo(
    () => completedReviews.filter((r) => inScope(getClaim(r.claimId), reviewerTeam[r.reviewer], scope)),
    [completedReviews, getClaim, reviewerTeam, scope],
  )

  const { types, byLine, overall } = useMemo(() => {
    const map: Record<string, TypeAgg> = {}
    const lineAgg: Record<string, { sum: number; count: number }> = {}
    let sumQ = 0,
      sumCal = 0,
      n = 0
    for (const r of reviews) {
      const claim = getClaim(r.claimId)
      if (!claim) continue
      const peril = basePeril(claim.perilType)
      const key = `${claim.line} · ${peril}`
      const t = (map[key] ??= { key, line: claim.line, peril, count: 0, sumQ: 0, sumCal: 0, q: {} })
      t.count++
      t.sumQ += r.qualityScore
      t.sumCal += r.calibration
      sumQ += r.qualityScore
      sumCal += r.calibration
      n++
      lineAgg[claim.line] ??= { sum: 0, count: 0 }
      lineAgg[claim.line].sum += r.qualityScore
      lineAgg[claim.line].count++
      const agentMap: Record<string, string> = {}
      claim.agentAnswers.forEach((a) => (agentMap[a.questionId] = a.value))
      for (const a of r.reviewerAnswers) {
        const cell = (t.q[a.questionId] ??= { agree: 0, total: 0, label: a.questionId })
        cell.total++
        if (a.value != null && a.value === agentMap[a.questionId]) cell.agree++
      }
    }
    const types = Object.values(map)
      .map((t) => ({ ...t, avgQ: Math.round(t.sumQ / t.count), avgCal: Math.round(t.sumCal / t.count) }))
      .sort((a, b) => a.avgQ - b.avgQ) // worst first — that's where attention is needed
    const byLine = (['Property', 'Auto', 'Casualty'] as Line[]).map((l) => ({
      line: l,
      score: lineAgg[l] ? Math.round(lineAgg[l].sum / lineAgg[l].count) : 0,
      count: lineAgg[l]?.count || 0,
    }))
    return { types, byLine, overall: { avgQ: n ? Math.round(sumQ / n) : 0, avgCal: n ? Math.round(sumCal / n) : 0, n, kinds: types.length } }
  }, [reviews, getClaim])

  const sel = types.find((t) => t.key === selected) || types[0]
  const selQuestions = useMemo(() => {
    if (!sel) return []
    return Object.values(sel.q)
      .map((c) => ({ label: c.label, reliability: Math.round((c.agree / c.total) * 100) }))
      .sort((a, b) => a.reliability - b.reliability)
  }, [sel])
  const selRecent = useMemo(() => {
    if (!sel) return []
    return reviews
      .filter((r) => {
        const c = getClaim(r.claimId)
        return c && c.line === sel.line && basePeril(c.perilType) === sel.peril
      })
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 6)
  }, [sel, reviews, getClaim])

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Claim Type Health"
          subtitle="How the organization is performing by type of claim — quality and AI calibration, where attention is needed."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Layers size={16} className="text-brand-500" />
              <span className="font-semibold text-brand-950">{overall.kinds}</span> claim types
            </div>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Kpi icon={TrendingUp} label="Avg quality" value={`${overall.avgQ}`} sub={scoreBand(overall.avgQ).label} />
          <Kpi icon={Gauge} label="AI calibration" value={`${overall.avgCal}%`} sub="reviewer/agent" orange />
          <Kpi icon={Activity} label="Reviews" value={`${overall.n}`} sub="this period" />
          {byLine.map((l) => (
            <Card key={l.line} className="p-4">
              <LinePill line={l.line} />
              <div className="mt-2 text-2xl font-extrabold text-brand-950 tabular-nums" style={{ color: LINE_COLORS[l.line] }}>{l.score || '—'}</div>
              <div className="text-[11px] text-slate-400">{l.count} reviews</div>
            </Card>
          ))}
        </div>

        {types.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">No reviews match these filters yet.</Card>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* ranked claim types — worst first */}
            <Card className="p-0 overflow-hidden h-fit">
              <div className="px-5 py-3.5 border-b border-brand-50 flex items-center justify-between">
                <h3 className="font-bold text-brand-950 text-sm">By claim type</h3>
                <span className="text-xs text-slate-400">lowest quality first</span>
              </div>
              <div className="divide-y divide-brand-50 max-h-[560px] overflow-auto">
                {types.map((t) => {
                  const band = scoreBand(t.avgQ)
                  const active = sel?.key === t.key
                  return (
                    <button key={t.key} onClick={() => setSelected(t.key)} className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${active ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}>
                      <LinePill line={t.line} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-brand-950 text-sm truncate">{t.peril}</div>
                        <div className="text-xs text-slate-400">{t.count} reviews</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">AI cal.</div>
                        <div className="text-sm font-semibold text-accent-600">{t.avgCal}%</div>
                      </div>
                      <div className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums w-12 text-center" style={{ color: band.color, background: band.bg }}>{t.avgQ}</div>
                      <ChevronRight size={16} className={active ? 'text-brand-500' : 'text-slate-300'} />
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* detail for selected claim type */}
            {sel && (
              <div className="space-y-4">
                <Card className="p-5">
                  <div className="flex items-center gap-2">
                    <LinePill line={sel.line} />
                    <span className="font-extrabold text-brand-950">{sel.peril}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <ScoreRing score={sel.avgQ} size={84} stroke={9} />
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><Gauge size={15} className="text-accent-500" /><span className="font-bold text-brand-950">{sel.avgCal}%</span><span className="text-slate-500 text-xs">AI calibration</span></div>
                      <div className="flex items-center gap-2"><Activity size={15} className="text-brand-500" /><span className="font-bold text-brand-950">{sel.count}</span><span className="text-slate-500 text-xs">reviews of this type</span></div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-brand-50">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Weakest questions for this type</div>
                    <div className="space-y-1.5">
                      {selQuestions.slice(0, 5).map((q) => (
                        <div key={q.label} className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 w-20 capitalize truncate">{q.label}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${q.reliability}%`, background: q.reliability >= 85 ? '#1c4fe0' : q.reliability >= 75 ? '#5996ff' : '#ff7a18' }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600 w-9 text-right tabular-nums">{q.reliability}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="text-brand-700 font-semibold text-sm mb-3">Recent reviews</div>
                  <div className="divide-y divide-brand-50">
                    {selRecent.map((r) => {
                      const claim = getClaim(r.claimId)
                      if (!claim) return null
                      const band = scoreBand(r.qualityScore)
                      return (
                        <div key={r.claimId} className="flex items-center gap-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-brand-950">{claim.claimNumber}</div>
                            <div className="text-[11px] text-slate-400">{r.completedAt}</div>
                          </div>
                          <span className="text-xs text-accent-600 font-semibold">{r.calibration}%</span>
                          <span className="text-sm font-bold px-2 py-0.5 rounded-md tabular-nums w-10 text-center" style={{ color: band.color, background: band.bg }}>{r.qualityScore}</span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
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
