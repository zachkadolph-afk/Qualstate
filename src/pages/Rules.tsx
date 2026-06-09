import { useMemo, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, GitBranch, FlaskConical, ArrowRight } from 'lucide-react'
import { Card, PageHeader, LinePill } from '../components/ui'
import { useStore } from '../lib/store'
import { Line } from '../data/types'
import { FORM_LINES, FORM_SCOPES, FORM_SEGMENTS, ReviewType } from '../data/forms'
import { TEAMS, Team } from '../data/users'
import { matchRule } from '../data/rules'

/* ------------------------------------------------------------------ */
/*  Assignment Rules — map (line + peril + segment + review type) to   */
/*  the form a claim is reviewed against and the team that handles it. */
/*  Top-to-bottom; first enabled match wins. System Manager only.      */
/* ------------------------------------------------------------------ */

const ALL_PERILS = Array.from(new Set([...FORM_SCOPES.Property, ...FORM_SCOPES.Auto, ...FORM_SCOPES.Casualty]))

export default function Rules() {
  const { rules, forms, addRule, updateRule, removeRule, moveRule } = useStore()
  const formName = (id: string) => forms.find((f) => f.id === id)?.name ?? '— select form —'

  // little tester
  const [tLine, setTLine] = useState<Line>('Property')
  const [tPeril, setTPeril] = useState<string>('Water Damage')
  const [tType, setTType] = useState<ReviewType>('Diagnostic')
  const matched = useMemo(() => matchRule(rules, tLine, tPeril, tType), [rules, tLine, tPeril, tType])

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Assignment Rules"
          subtitle="Map claim attributes to the right form and team. Evaluated top-to-bottom — first match wins."
          right={
            <button onClick={addRule} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-colors">
              <Plus size={16} /> Add rule
            </button>
          }
        />

        {/* tester */}
        <Card className="p-4 mb-5">
          <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm mb-3">
            <FlaskConical size={15} /> Test a claim
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Pick label="Line" value={tLine} onChange={(v) => setTLine(v as Line)} options={FORM_LINES} />
            <Pick label="Peril" value={tPeril} onChange={setTPeril} options={ALL_PERILS} />
            <Pick label="Review type" value={tType} onChange={(v) => setTType(v as ReviewType)} options={['Diagnostic', 'Targeted']} />
            <ArrowRight size={18} className="text-slate-300" />
            {matched ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-brand-950">{formName(matched.formId)}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{matched.team === 'Any' ? 'any team' : matched.team}</span>
              </div>
            ) : (
              <span className="text-sm text-slate-400">No rule matches — falls back to the published form for the line.</span>
            )}
          </div>
        </Card>

        {/* rules table */}
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-[28px_1fr_1.1fr_1fr_1fr_1.6fr_1.2fr_70px] gap-2 px-4 py-3 border-b border-brand-50 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <span></span>
            <span>Line</span>
            <span>Peril</span>
            <span>Segment</span>
            <span>Review type</span>
            <span>Form</span>
            <span>Team</span>
            <span></span>
          </div>
          <div className="divide-y divide-brand-50">
            {rules.map((r, idx) => {
              const perilOpts = r.line === 'Any' ? ALL_PERILS : FORM_SCOPES[r.line as Line]
              const formOpts = forms.filter((f) => f.status === 'Published' && (r.line === 'Any' || f.line === r.line) && (r.reviewType === 'Any' || f.reviewType === r.reviewType))
              return (
                <div key={r.id} className={`grid grid-cols-[28px_1fr_1.1fr_1fr_1fr_1.6fr_1.2fr_70px] gap-2 px-4 py-2.5 items-center ${r.enabled ? '' : 'opacity-50'}`}>
                  <div className="flex flex-col items-center gap-0.5">
                    <button onClick={() => moveRule(r.id, -1)} disabled={idx === 0} className="text-slate-300 hover:text-brand-600 disabled:opacity-30"><ArrowUp size={13} /></button>
                    <button onClick={() => moveRule(r.id, 1)} disabled={idx === rules.length - 1} className="text-slate-300 hover:text-brand-600 disabled:opacity-30"><ArrowDown size={13} /></button>
                  </div>
                  <Sel value={r.line} onChange={(v) => updateRule(r.id, { line: v as Line | 'Any', peril: 'Any' })} options={['Any', ...FORM_LINES]} render={(o) => (o === 'Any' ? 'Any' : o)} pill={r.line !== 'Any' ? (r.line as Line) : undefined} />
                  <Sel value={r.peril} onChange={(v) => updateRule(r.id, { peril: v })} options={['Any', ...perilOpts]} />
                  <Sel value={r.segment} onChange={(v) => updateRule(r.id, { segment: v })} options={['Any', ...FORM_SEGMENTS]} />
                  <Sel value={r.reviewType} onChange={(v) => updateRule(r.id, { reviewType: v as ReviewType | 'Any' })} options={['Any', 'Diagnostic', 'Targeted']} />
                  <Sel value={r.formId} onChange={(v) => updateRule(r.id, { formId: v })} options={formOpts.map((f) => f.id)} render={(id) => forms.find((f) => f.id === id)?.name ?? '—'} />
                  <Sel value={r.team} onChange={(v) => updateRule(r.id, { team: v as Team | 'Any' })} options={['Any', ...TEAMS]} />
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => updateRule(r.id, { enabled: !r.enabled })} title={r.enabled ? 'Disable' : 'Enable'} className={`w-8 h-5 rounded-full relative transition-colors ${r.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${r.enabled ? 'left-3.5' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => removeRule(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </div>
              )
            })}
            {rules.length === 0 && <div className="px-4 py-10 text-center text-sm text-slate-400">No rules yet. Add one to route claims to forms.</div>}
          </div>
        </Card>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <GitBranch size={14} /> A claim is matched against these rules in order; the first enabled match selects its review form and routing team. Sampling assignments can still override per file.
        </div>
      </div>
    </div>
  )
}

function Sel({ value, onChange, options, render, pill }: { value: string; onChange: (v: string) => void; options: string[]; render?: (o: string) => string; pill?: Line }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {pill && <LinePill line={pill} />}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="text-xs text-slate-700 bg-slate-50 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer w-full truncate">
        {options.map((o) => (
          <option key={o} value={o}>{render ? render(o) : o}</option>
        ))}
      </select>
    </div>
  )
}

function Pick({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="text-sm rounded-lg border border-brand-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
