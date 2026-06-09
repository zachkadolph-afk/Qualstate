import { useMemo, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, ListChecks, Save, RotateCcw, Gauge } from 'lucide-react'
import { Card, PageHeader, LinePill, ScoreRing } from '../components/ui'
import { QUESTIONNAIRES, ANSWER_POINTS, ANSWER_LABEL } from '../data/questions'
import { scoreBand } from '../lib/scoring'
import { Line, Question, AnswerValue } from '../data/types'

/* ------------------------------------------------------------------ */
/*  Questionnaire Builder — fully interactive but self-contained.      */
/*  Edits a LOCAL draft cloned from QUESTIONNAIRES and a LOCAL set of   */
/*  sample answers; the live scoring preview is computed from the       */
/*  draft weights. It never mutates the shared spine.                  */
/* ------------------------------------------------------------------ */

const LINES: Line[] = ['Property', 'Auto', 'Casualty']
const CATEGORIES = ['Customer', 'Technical', 'Financial', 'Regulatory', 'Process']
const ANSWER_VALUES: AnswerValue[] = ['yes', 'partial', 'no', 'na']

let uidCounter = 0
const uid = () => `q_${Date.now()}_${uidCounter++}`

export default function QuestionnaireBuilder() {
  const [line, setLine] = useState<Line>('Property')
  const [draft, setDraft] = useState<Record<Line, Question[]>>(() => JSON.parse(JSON.stringify(QUESTIONNAIRES)))
  const [sample, setSample] = useState<Record<string, AnswerValue>>({})
  const [savedFlash, setSavedFlash] = useState(false)

  const questions = draft[line]
  const totalWeight = useMemo(() => questions.reduce((s, q) => s + (q.weight || 0), 0), [questions])

  // live weighted score from the DRAFT weights + sample answers (default Met)
  const preview = useMemo(() => {
    let earned = 0
    let possible = 0
    for (const q of questions) {
      const v = sample[q.id] ?? 'yes'
      if (v === 'na') continue
      possible += q.weight
      earned += q.weight * ANSWER_POINTS[v]
    }
    return possible === 0 ? 0 : Math.round((earned / possible) * 100)
  }, [questions, sample])
  const band = scoreBand(preview)

  function update(id: string, patch: Partial<Question>) {
    setDraft((d) => ({ ...d, [line]: d[line].map((q) => (q.id === id ? { ...q, ...patch } : q)) }))
  }
  function remove(id: string) {
    setDraft((d) => ({ ...d, [line]: d[line].filter((q) => q.id !== id) }))
  }
  function move(id: string, dir: -1 | 1) {
    setDraft((d) => {
      const arr = [...d[line]]
      const i = arr.findIndex((q) => q.id === id)
      const j = i + dir
      if (j < 0 || j >= arr.length) return d
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...d, [line]: arr }
    })
  }
  function add() {
    setDraft((d) => ({
      ...d,
      [line]: [...d[line], { id: uid(), label: 'New question', prompt: 'Describe what the reviewer should verify…', category: 'Technical', weight: 1 }],
    }))
  }
  function reset() {
    setDraft((d) => ({ ...d, [line]: JSON.parse(JSON.stringify(QUESTIONNAIRES[line])) }))
    setSample({})
  }
  function save() {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="Questionnaire Builder"
          subtitle="Define the quality questions, weights, and categories the AI answers and reviewers validate — per line of business."
          right={
            <div className="flex items-center gap-2">
              <button onClick={reset} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700 px-3 py-2 rounded-xl border border-brand-100 bg-white shadow-card">
                <RotateCcw size={15} /> Reset line
              </button>
              <button onClick={save} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-colors">
                <Save size={15} /> {savedFlash ? 'Saved ✓' : 'Save draft'}
              </button>
            </div>
          }
        />

        {/* line tabs + summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex bg-white rounded-xl border border-brand-100 p-1 shadow-card">
            {LINES.map((l) => (
              <button key={l} onClick={() => setLine(l)} className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${line === l ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-brand-700'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span><span className="font-bold text-brand-950">{questions.length}</span> questions</span>
            <span>total weight <span className="font-bold text-brand-950">{totalWeight.toFixed(1)}</span></span>
            <LinePill line={line} />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* editor column */}
          <div>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <Card key={q.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button onClick={() => move(q.id, -1)} disabled={idx === 0} className="text-slate-300 hover:text-brand-600 disabled:opacity-30">
                        <ArrowUp size={15} />
                      </button>
                      <span className="text-xs font-bold text-slate-400 tabular-nums">{idx + 1}</span>
                      <button onClick={() => move(q.id, 1)} disabled={idx === questions.length - 1} className="text-slate-300 hover:text-brand-600 disabled:opacity-30">
                        <ArrowDown size={15} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input value={q.label} onChange={(e) => update(q.id, { label: e.target.value })} className="font-semibold text-brand-950 text-sm border-b border-transparent hover:border-brand-200 focus:border-brand-500 focus:outline-none px-1 py-0.5 bg-transparent" />
                        <select value={q.category} onChange={(e) => update(q.id, { category: e.target.value })} className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-1 focus:outline-none">
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 ml-auto">
                          weight
                          <input type="number" step={0.5} min={0} value={q.weight} onChange={(e) => update(q.id, { weight: parseFloat(e.target.value) || 0 })} className="w-16 rounded-md border border-brand-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                        </div>
                        <button onClick={() => remove(q.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea value={q.prompt} onChange={(e) => update(q.id, { prompt: e.target.value })} rows={2} className="w-full text-sm text-slate-600 rounded-lg border border-brand-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />

                      {/* sample answer selector — drives the live score */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-semibold">Sample answer:</span>
                        {ANSWER_VALUES.map((v) => {
                          const active = (sample[q.id] ?? 'yes') === v
                          return (
                            <button
                              key={v}
                              onClick={() => setSample((s) => ({ ...s, [q.id]: v }))}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${active ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-brand-300'}`}
                            >
                              {ANSWER_LABEL[v]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <button onClick={add} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-brand-200 text-brand-600 font-semibold text-sm hover:bg-brand-50/50 transition-colors">
              <Plus size={17} /> Add question
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ListChecks size={14} />
              Changes here are a local draft — saving would version the questionnaire so existing scores stay reproducible.
            </div>
          </div>

          {/* live scoring preview rail */}
          <div className="lg:sticky lg:top-6 h-fit space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                <Gauge size={14} /> Live scoring preview
              </div>
              <div className="flex items-center gap-4">
                <ScoreRing score={preview} size={88} stroke={9} />
                <div>
                  <div className="text-sm font-bold px-2.5 py-1 rounded-full inline-block" style={{ color: band.color, background: band.bg }}>
                    {band.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">From the current weights and sample answers</div>
                </div>
              </div>
              <p className="mt-4 pt-4 border-t border-brand-50 text-xs text-slate-500 leading-relaxed">
                Adjust any <span className="font-semibold text-brand-950">weight</span> or <span className="font-semibold text-brand-950">sample answer</span> and
                this score recomputes instantly — exactly how the reviewer's validated score is calculated. N/A items drop out of the denominator.
              </p>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Weight distribution</div>
              <div className="space-y-1.5">
                {questions.map((q) => (
                  <div key={q.id} className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 w-20 truncate">{q.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-400" style={{ width: `${totalWeight ? (q.weight / totalWeight) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 tabular-nums w-7 text-right">{q.weight}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
