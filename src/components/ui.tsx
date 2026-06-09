import { ReactNode } from 'react'
import { Line } from '../data/types'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-brand-100/70 ${className}`}>
      {children}
    </div>
  )
}

const LINE_STYLE: Record<Line, string> = {
  Property: 'bg-brand-50 text-brand-700 border-brand-200',
  Auto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Casualty: 'bg-violet-50 text-violet-700 border-violet-200',
}

export function LinePill({ line }: { line: Line }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${LINE_STYLE[line]}`}>
      {line}
    </span>
  )
}

const SEV_STYLE: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Moderate: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Severe: 'bg-red-100 text-red-700',
}

export function SeverityChip({ severity }: { severity: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ${SEV_STYLE[severity] || ''}`}>
      {severity}
    </span>
  )
}

export function ScoreRing({ score, size = 64, stroke = 7 }: { score: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color = score >= 90 ? '#16a34a' : score >= 80 ? '#1c4fe0' : score >= 70 ? '#d97706' : '#dc2626'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2fb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-extrabold tabular-nums" style={{ color, fontSize: size * 0.3 }}>
          {score}
        </span>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-950">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
