import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { Gauge, Sparkles, AlertTriangle, CheckCircle2, Target } from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, PageHeader } from '../components/ui'
import { QUESTIONNAIRES } from '../data/questions'

/* ------------------------------------------------------------------ */
/*  Calibration / Model Reliability — read-only analytics over the     */
/*  completed-review data. Additive; mutates nothing.                  */
/* ------------------------------------------------------------------ */

const Q_LABELS: Record<string, string> = {}
QUESTIONNAIRES.Property.forEach((q) => (Q_LABELS[q.id] = q.label))

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px -12px rgba(16,33,73,0.25)',
  fontSize: 12,
}

export default function Calibration() {
  const { completedReviews, getClaim } = useStore()

  const data = useMemo(() => {
    const qAgg: Record<string, { agree: number; total: number }> = {}
    const confBuckets: Record<string, { agree: number; total: number }> = {
      '50–70%': { agree: 0, total: 0 },
      '70–80%': { agree: 0, total: 0 },
      '80–90%': { agree: 0, total: 0 },
      '90–100%': { agree: 0, total: 0 },
    }
    let totalAgree = 0
    let totalAnswers = 0

    for (const r of completedReviews) {
      const claim = getClaim(r.claimId)
      for (const a of r.reviewerAnswers) {
        qAgg[a.questionId] ??= { agree: 0, total: 0 }
        qAgg[a.questionId].total++
        totalAnswers++
        const agreed = a.decision === 'agree'
        if (agreed) {
          qAgg[a.questionId].agree++
          totalAgree++
        }
        // join to the AI's self-reported confidence for this question
        const conf = claim?.agentAnswers.find((x) => x.questionId === a.questionId)?.confidence
        if (typeof conf === 'number') {
          const key = conf < 0.7 ? '50–70%' : conf < 0.8 ? '70–80%' : conf < 0.9 ? '80–90%' : '90–100%'
          confBuckets[key].total++
          if (agreed) confBuckets[key].agree++
        }
      }
    }

    const byQuestion = Object.entries(qAgg)
      .map(([id, v]) => ({
        id,
        label: Q_LABELS[id] || id,
        reliability: Math.round((v.agree / v.total) * 100),
        corrections: v.total - v.agree,
      }))
      .sort((a, b) => b.reliability - a.reliability)

    const byConfidence = Object.entries(confBuckets).map(([band, v]) => ({
      band,
      agreement: v.total ? Math.round((v.agree / v.total) * 100) : 0,
      n: v.total,
    }))

    // weekly calibration trend
    const sorted = [...completedReviews].sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    const weekly: Record<string, { cal: number; count: number }> = {}
    for (const r of sorted) {
      const d = new Date(r.completedAt)
      const onejan = new Date(d.getFullYear(), 0, 1)
      const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
      const key = `W${week}`
      weekly[key] ??= { cal: 0, count: 0 }
      weekly[key].cal += r.calibration
      weekly[key].count++
    }
    const trend = Object.entries(weekly).map(([week, v]) => ({ week, calibration: Math.round(v.cal / v.count) }))

    const overall = totalAnswers ? Math.round((totalAgree / totalAnswers) * 100) : 0
    return {
      byQuestion,
      byConfidence,
      trend,
      overall,
      totalCorrections: totalAnswers - totalAgree,
      best: byQuestion[0],
      worst: byQuestion[byQuestion.length - 1],
    }
  }, [completedReviews, getClaim])

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Model Reliability"
          subtitle="How well the AI's first-pass holds up against reviewer validation — by question and by confidence."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <Gauge size={16} className="text-accent-500" />
              <span className="font-semibold text-brand-950">{data.overall}%</span> overall agreement
            </div>
          }
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Kpi icon={Gauge} label="Overall calibration" value={`${data.overall}%`} sub="reviewer agreement" />
          <Kpi icon={Sparkles} label="Correction signals" value={`${data.totalCorrections}`} sub="captured for training" orange />
          <Kpi icon={CheckCircle2} label="Most reliable" value={data.best?.label || '—'} sub={`${data.best?.reliability ?? 0}% agreement`} />
          <Kpi icon={AlertTriangle} label="Needs work" value={data.worst?.label || '—'} sub={`${data.worst?.reliability ?? 0}% agreement`} />
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          {/* per-question reliability */}
          <Card className="p-5 lg:col-span-2">
            <ChartHeader title="Reliability by Question" sub="Reviewer agreement % per question — where the model earns trust and where it doesn't" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byQuestion} layout="vertical" margin={{ left: 24, right: 16, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={86} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5fd' }} />
                <Bar dataKey="reliability" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {data.byQuestion.map((d) => (
                    <Cell key={d.id} fill={d.reliability >= 85 ? '#1c4fe0' : d.reliability >= 75 ? '#5996ff' : '#ff7a18'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* confidence vs agreement */}
          <Card className="p-5">
            <ChartHeader title="Confidence vs. Agreement" sub="Is the AI's confidence meaningful?" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byConfidence} margin={{ left: -18, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5fd' }} />
                <Bar dataKey="agreement" radius={[6, 6, 0, 0]} maxBarSize={46}>
                  {data.byConfidence.map((d, i) => (
                    <Cell key={d.band} fill={['#ffb27a', '#5996ff', '#2f6df6', '#1c4fe0'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <Target size={12} /> Agreement should climb with confidence — the sign of a well-calibrated model.
            </p>
          </Card>
        </div>

        {/* trend + insight */}
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="p-5 lg:col-span-2">
            <ChartHeader title="Calibration Trend" sub="Weekly average reviewer agreement" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gCal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a18" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ff7a18" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="calibration" stroke="#ff7a18" strokeWidth={2.5} fill="url(#gCal)" name="Calibration" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-0">
            <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-wide">
              <AlertTriangle size={14} /> Next training cycle
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">
              The model is weakest on <span className="font-bold text-accent-400">{data.worst?.label}</span> at{' '}
              <span className="font-bold">{data.worst?.reliability}%</span> agreement, with{' '}
              <span className="font-bold">{data.worst?.corrections}</span> corrections captured. These are prioritized for the
              next retraining pass.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-brand-100/80">
              Strongest on <span className="font-bold text-white">{data.best?.label}</span> at{' '}
              <span className="font-bold text-white">{data.best?.reliability}%</span> — already trustworthy enough to auto-pass.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, sub, orange }: { icon: any; label: string; value: string; sub: string; orange?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-xl grid place-items-center ${orange ? 'text-accent-600' : 'bg-brand-50 text-brand-600'}`} style={orange ? { background: '#ffedd9' } : {}}>
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-2 text-xl font-extrabold text-brand-950 truncate">{value}</div>
      <div className="text-xs mt-1 text-slate-400">{sub}</div>
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
