import { useMemo, useState } from 'react'
import { Trophy, TrendingUp, TrendingDown, Gauge, Sparkles, ChevronRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, PageHeader, LinePill, ScoreRing } from '../components/ui'
import { scoreBand } from '../lib/scoring'
import { Line } from '../data/types'

/* ------------------------------------------------------------------ */
/*  Adjuster Scorecards — read-only analytics derived from the         */
/*  completed-review data already in the store. Purely additive: it    */
/*  reads `completedReviews` + `getClaim` and never mutates anything.  */
/* ------------------------------------------------------------------ */

interface AdjusterAgg {
  adjuster: string
  count: number
  avgQuality: number
  avgCalibration: number
  avgDelta: number // final score minus AI-only score
  byLine: Record<string, { sum: number; count: number }>
  lastReviewed: string
}

export default function Scorecards() {
  const { completedReviews, getClaim } = useStore()
  const [selected, setSelected] = useState<string | null>(null)

  const adjusters = useMemo<AdjusterAgg[]>(() => {
    const map: Record<string, AdjusterAgg> = {}
    for (const r of completedReviews) {
      const claim = getClaim(r.claimId)
      if (!claim) continue
      const a = (map[claim.adjuster] ??= {
        adjuster: claim.adjuster,
        count: 0,
        avgQuality: 0,
        avgCalibration: 0,
        avgDelta: 0,
        byLine: {},
        lastReviewed: r.completedAt,
      })
      a.count++
      a.avgQuality += r.qualityScore
      a.avgCalibration += r.calibration
      a.avgDelta += r.qualityScore - r.agentScore
      a.byLine[claim.line] ??= { sum: 0, count: 0 }
      a.byLine[claim.line].sum += r.qualityScore
      a.byLine[claim.line].count++
      if (r.completedAt > a.lastReviewed) a.lastReviewed = r.completedAt
    }
    const out = Object.values(map).map((a) => ({
      ...a,
      avgQuality: Math.round(a.avgQuality / a.count),
      avgCalibration: Math.round(a.avgCalibration / a.count),
      avgDelta: Math.round(a.avgDelta / a.count),
    }))
    return out.sort((x, y) => y.avgQuality - x.avgQuality)
  }, [completedReviews, getClaim])

  const teamAvg = useMemo(() => {
    if (adjusters.length === 0) return { quality: 0, calibration: 0 }
    const q = Math.round(adjusters.reduce((s, a) => s + a.avgQuality, 0) / adjusters.length)
    const c = Math.round(adjusters.reduce((s, a) => s + a.avgCalibration, 0) / adjusters.length)
    return { quality: q, calibration: c }
  }, [adjusters])

  const sel = adjusters.find((a) => a.adjuster === selected) || adjusters[0]
  const selReviews = useMemo(() => {
    if (!sel) return []
    return completedReviews
      .filter((r) => getClaim(r.claimId)?.adjuster === sel.adjuster)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 6)
  }, [sel, completedReviews, getClaim])

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Adjuster Scorecards"
          subtitle="Reviewer-validated quality and AI calibration by adjuster — ranked across all lines."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Trophy size={16} className="text-accent-500" />
              <span className="font-semibold text-brand-950">{adjusters.length}</span> adjusters scored
            </div>
          }
        />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* ranked table */}
          <Card className="p-0 overflow-hidden h-fit">
            <div className="px-5 py-3.5 border-b border-brand-50 flex items-center justify-between">
              <h3 className="font-bold text-brand-950 text-sm">Quality Leaderboard</h3>
              <span className="text-xs text-slate-400">
                Team avg <span className="font-semibold text-brand-700">{teamAvg.quality}</span> · cal{' '}
                <span className="font-semibold text-accent-600">{teamAvg.calibration}%</span>
              </span>
            </div>
            <div className="divide-y divide-brand-50">
              {adjusters.map((a, i) => {
                const band = scoreBand(a.avgQuality)
                const active = sel?.adjuster === a.adjuster
                return (
                  <button
                    key={a.adjuster}
                    onClick={() => setSelected(a.adjuster)}
                    className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${
                      active ? 'bg-brand-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-6 text-center font-extrabold tabular-nums ${i < 3 ? 'text-accent-500' : 'text-slate-300'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-950 text-sm">{a.adjuster}</div>
                      <div className="text-xs text-slate-400">{a.count} reviews · last {a.lastReviewed}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">AI cal.</div>
                      <div className="text-sm font-semibold text-accent-600">{a.avgCalibration}%</div>
                    </div>
                    <div
                      className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums w-12 text-center"
                      style={{ color: band.color, background: band.bg }}
                    >
                      {a.avgQuality}
                    </div>
                    <ChevronRight size={16} className={active ? 'text-brand-500' : 'text-slate-300'} />
                  </button>
                )
              })}
            </div>
          </Card>

          {/* detail panel */}
          {sel && (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 grid place-items-center text-white font-bold">
                    {sel.adjuster.replace(/[^A-Z]/g, '').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-extrabold text-brand-950">{sel.adjuster}</div>
                    <div className="text-xs text-slate-400">{sel.count} claims reviewed</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <ScoreRing score={sel.avgQuality} size={84} stroke={9} />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Gauge size={15} className="text-accent-500" />
                      <span className="font-bold text-brand-950">{sel.avgCalibration}%</span>
                      <span className="text-slate-500 text-xs">AI calibration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {sel.avgDelta >= 0 ? (
                        <TrendingUp size={15} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={15} className="text-red-500" />
                      )}
                      <span className="font-bold text-brand-950">
                        {sel.avgDelta >= 0 ? '+' : ''}
                        {sel.avgDelta}
                      </span>
                      <span className="text-slate-500 text-xs">avg reviewer adjustment vs AI</span>
                    </div>
                  </div>
                </div>

                {/* by line */}
                <div className="mt-5 pt-4 border-t border-brand-50">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">By line</div>
                  <div className="space-y-2">
                    {(['Property', 'Auto', 'Casualty'] as Line[]).map((l) => {
                      const v = sel.byLine[l]
                      const score = v ? Math.round(v.sum / v.count) : null
                      return (
                        <div key={l} className="flex items-center gap-3">
                          <div className="w-20"><LinePill line={l} /></div>
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${score ?? 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-brand-950 w-14 text-right tabular-nums">
                            {score === null ? '—' : score}
                            {score !== null && <span className="text-xs text-slate-400"> · {v.count}</span>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm mb-3">
                  <Sparkles size={15} /> Recent reviews
                </div>
                <div className="divide-y divide-brand-50">
                  {selReviews.map((r) => {
                    const claim = getClaim(r.claimId)
                    if (!claim) return null
                    const band = scoreBand(r.qualityScore)
                    return (
                      <div key={r.claimId} className="flex items-center gap-3 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-brand-950">{claim.claimNumber}</span>
                            <LinePill line={claim.line} />
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {r.reviewer} · {r.completedAt}
                          </div>
                        </div>
                        <span className="text-xs text-accent-600 font-semibold">{r.calibration}%</span>
                        <span
                          className="text-sm font-bold px-2 py-0.5 rounded-md tabular-nums w-10 text-center"
                          style={{ color: band.color, background: band.bg }}
                        >
                          {r.qualityScore}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
