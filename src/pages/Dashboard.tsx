import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  TrendingUp,
  Gauge,
  ClipboardList,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, LinePill, PageHeader } from '../components/ui'
import { QUESTIONNAIRES } from '../data/questions'
import { Line as LineType } from '../data/types'
import { scoreBand } from '../lib/scoring'

const LINE_COLORS: Record<string, string> = {
  Property: '#1c4fe0',
  Auto: '#10b981',
  Casualty: '#8b5cf6',
}

// canonical question labels (shared spine across lines)
const Q_LABELS: Record<string, string> = {}
QUESTIONNAIRES.Property.forEach((q) => (Q_LABELS[q.id] = q.label))

export default function Dashboard() {
  const { completedReviews, reviewClaims, getClaim } = useStore()

  const analytics = useMemo(() => {
    const n = completedReviews.length
    const avgQuality = Math.round(completedReviews.reduce((s, r) => s + r.qualityScore, 0) / n)
    const avgAgent = Math.round(completedReviews.reduce((s, r) => s + r.agentScore, 0) / n)
    const avgCalibration = Math.round(completedReviews.reduce((s, r) => s + r.calibration, 0) / n)

    // by line
    const lineAgg: Record<string, { sum: number; count: number }> = {}
    // per-question calibration
    const qAgg: Record<string, { agree: number; total: number }> = {}
    let totalAgree = 0
    let totalDisagree = 0

    for (const r of completedReviews) {
      const claim = getClaim(r.claimId)
      if (claim) {
        lineAgg[claim.line] ??= { sum: 0, count: 0 }
        lineAgg[claim.line].sum += r.qualityScore
        lineAgg[claim.line].count++
      }
      for (const a of r.reviewerAnswers) {
        qAgg[a.questionId] ??= { agree: 0, total: 0 }
        qAgg[a.questionId].total++
        if (a.decision === 'agree') {
          qAgg[a.questionId].agree++
          totalAgree++
        } else {
          totalDisagree++
        }
      }
    }

    const byLine = (['Property', 'Auto', 'Casualty'] as LineType[]).map((l) => ({
      line: l,
      score: lineAgg[l] ? Math.round(lineAgg[l].sum / lineAgg[l].count) : 0,
      count: lineAgg[l]?.count || 0,
    }))

    const byQuestion = Object.entries(qAgg)
      .map(([id, v]) => ({
        id,
        label: Q_LABELS[id] || id,
        reliability: Math.round((v.agree / v.total) * 100),
      }))
      .sort((a, b) => b.reliability - a.reliability)

    // trend by week
    const sorted = [...completedReviews].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    const weekly: Record<string, { sum: number; cal: number; count: number }> = {}
    for (const r of sorted) {
      const d = new Date(r.completedAt)
      const onejan = new Date(d.getFullYear(), 0, 1)
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
      const key = `W${week}`
      weekly[key] ??= { sum: 0, cal: 0, count: 0 }
      weekly[key].sum += r.qualityScore
      weekly[key].cal += r.calibration
      weekly[key].count++
    }
    const trend = Object.entries(weekly).map(([week, v]) => ({
      week,
      quality: Math.round(v.sum / v.count),
      calibration: Math.round(v.cal / v.count),
    }))

    return {
      n,
      avgQuality,
      avgAgent,
      avgCalibration,
      byLine,
      byQuestion,
      trend,
      totalAgree,
      totalDisagree,
    }
  }, [completedReviews, getClaim])

  const recent = completedReviews.slice(0, 6)
  const agreeData = [
    { name: 'Agreed', value: analytics.totalAgree, color: '#1c4fe0' },
    { name: 'Corrected', value: analytics.totalDisagree, color: '#ff7a18' },
  ]
  const leastReliable = analytics.byQuestion[analytics.byQuestion.length - 1]

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Quality Dashboard"
          subtitle="Personal lines claims quality & AI calibration · Q2 2026"
          right={
            <Link
              to="/queue"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-colors"
            >
              <ClipboardList size={16} /> Review Queue
              {reviewClaims.length > 0 && (
                <span className="bg-accent-500 text-white text-xs rounded-full px-2 py-0.5">
                  {reviewClaims.length}
                </span>
              )}
            </Link>
          }
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Kpi
            icon={ClipboardList}
            label="Claims Reviewed"
            value={`${analytics.n}`}
            sub={`${reviewClaims.length} pending in queue`}
          />
          <Kpi
            icon={TrendingUp}
            label="Avg Quality Score"
            value={`${analytics.avgQuality}`}
            sub={scoreBand(analytics.avgQuality).label}
            accent={analytics.avgQuality >= 80}
          />
          <Kpi
            icon={Gauge}
            label="AI Calibration"
            value={`${analytics.avgCalibration}%`}
            sub="reviewer/agent agreement"
            orange
          />
          <Kpi
            icon={Sparkles}
            label="AI vs Final Δ"
            value={`${analytics.avgQuality - analytics.avgAgent >= 0 ? '+' : ''}${
              analytics.avgQuality - analytics.avgAgent
            }`}
            sub="pts reviewer adjustment"
          />
        </div>

        {/* charts row 1 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          <Card className="p-5 lg:col-span-2">
            <ChartHeader title="Quality & Calibration Trend" sub="Weekly average across all lines" />
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={analytics.trend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f6df6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2f6df6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a18" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ff7a18" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="quality" stroke="#2f6df6" strokeWidth={2.5} fill="url(#gQ)" name="Quality" />
                <Area type="monotone" dataKey="calibration" stroke="#ff7a18" strokeWidth={2.5} fill="url(#gC)" name="AI Calibration" />
              </AreaChart>
            </ResponsiveContainer>
            <Legend items={[{ c: '#2f6df6', l: 'Quality Score' }, { c: '#ff7a18', l: 'AI Calibration' }]} />
          </Card>

          <Card className="p-5">
            <ChartHeader title="AI Agreement" sub="Validated vs. corrected answers" />
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={agreeData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                  {agreeData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center -mt-[122px] mb-[78px] pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-brand-950">
                  {Math.round((analytics.totalAgree / (analytics.totalAgree + analytics.totalDisagree)) * 100)}%
                </div>
                <div className="text-[11px] text-slate-400">agreement</div>
              </div>
            </div>
            <Legend items={[{ c: '#1c4fe0', l: 'Agreed' }, { c: '#ff7a18', l: 'Corrected' }]} />
          </Card>
        </div>

        {/* charts row 2 */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          <Card className="p-5">
            <ChartHeader title="Quality by Line" sub="Average score per business line" />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={analytics.byLine} margin={{ left: -20, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" vertical={false} />
                <XAxis dataKey="line" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5fd' }} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={64}>
                  {analytics.byLine.map((d) => (
                    <Cell key={d.line} fill={LINE_COLORS[d.line]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <ChartHeader
              title="AI Reliability by Question"
              sub="Which questions the model answers most reliably (reviewer agreement %)"
            />
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={analytics.byQuestion}
                layout="vertical"
                margin={{ left: 24, right: 16, top: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={86}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5fd' }} />
                <Bar dataKey="reliability" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {analytics.byQuestion.map((d) => (
                    <Cell key={d.id} fill={d.reliability >= 85 ? '#1c4fe0' : d.reliability >= 75 ? '#5996ff' : '#ff7a18'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* insight + recent */}
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="p-5 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-0">
            <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-wide">
              <AlertTriangle size={14} /> Calibration Insight
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">
              The model is least reliable on{' '}
              <span className="font-bold text-accent-400">{leastReliable?.label}</span> questions, with
              only <span className="font-bold">{leastReliable?.reliability}%</span> reviewer agreement.
              These corrections are prioritized in the next training cycle.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-brand-100/80">
              <span className="font-bold text-white">{analytics.totalDisagree}</span> correction signals
              captured this quarter, improving{' '}
              <span className="font-bold text-white">{analytics.byQuestion.length}</span> question models.
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <ChartHeader title="Recent Reviews" sub="Latest validated claims" />
            <div className="divide-y divide-brand-50">
              {recent.map((r) => {
                const claim = getClaim(r.claimId)
                if (!claim) return null
                const band = scoreBand(r.qualityScore)
                return (
                  <div key={r.claimId} className="flex items-center gap-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-950">{claim.claimNumber}</span>
                        <LinePill line={claim.line} />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {r.reviewer} · {r.completedAt}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">AI cal.</div>
                      <div className="text-sm font-semibold text-accent-600">{r.calibration}%</div>
                    </div>
                    <div
                      className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums w-12 text-center"
                      style={{ color: band.color, background: band.bg }}
                    >
                      {r.qualityScore}
                    </div>
                  </div>
                )
              })}
            </div>
            <Link
              to="/queue"
              className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:gap-2.5 transition-all"
            >
              Go to review queue <ArrowRight size={15} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px -12px rgba(16,33,73,0.25)',
  fontSize: 12,
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  orange,
}: {
  icon: any
  label: string
  value: string
  sub: string
  accent?: boolean
  orange?: boolean
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <div
          className={`w-9 h-9 rounded-xl grid place-items-center ${
            orange ? 'text-accent-600' : 'bg-brand-50 text-brand-600'
          }`}
          style={orange ? { background: '#ffedd9' } : {}}
        >
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-brand-950 tabular-nums">{value}</div>
      <div className={`text-xs mt-1 flex items-center gap-1 ${accent ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
        {accent && <ArrowUpRight size={13} />}
        {sub}
      </div>
    </Card>
  )
}

function ChartHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-bold text-brand-950">{title}</h3>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}

function Legend({ items }: { items: { c: string; l: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-5 mt-2">
      {items.map((i) => (
        <div key={i.l} className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: i.c }} />
          {i.l}
        </div>
      ))}
    </div>
  )
}
