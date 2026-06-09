import { useMemo, useState, ReactNode } from 'react'
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ListChecks,
  Save,
  RotateCcw,
  Gauge,
  ArrowLeft,
  Search,
  Copy,
  Archive,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, PageHeader, LinePill, ScoreRing } from '../components/ui'
import { QUESTIONNAIRES, ANSWER_POINTS, ANSWER_LABEL } from '../data/questions'
import { scoreBand } from '../lib/scoring'
import { Line, Question, AnswerValue } from '../data/types'

/* ------------------------------------------------------------------ */
/*  Questionnaire Builder — a library of review FORMS, each tied to a   */
/*  line of business, plus a per-form editor with a live scoring        */
/*  preview. Fully self-contained local state; mutates nothing shared.  */
/* ------------------------------------------------------------------ */

type FormStatus = 'Published' | 'Draft' | 'Archived'

interface ReviewForm {
  id: string
  name: string
  line: Line
  scope: string
  segment: string
  status: FormStatus
  version: number
  updated: string
  questions: Question[]
}

const LINES: Line[] = ['Property', 'Auto', 'Casualty']
const CATEGORIES = ['Customer', 'Technical', 'Financial', 'Regulatory', 'Process']
const ANSWER_VALUES: AnswerValue[] = ['yes', 'partial', 'no', 'na']

const SCOPES: Record<Line, string[]> = {
  Property: ['Water Damage', 'Wind/Hail', 'Fire', 'Theft', 'Freeze', 'Flood', 'Lightning', 'Mold', 'Vandalism', 'Roof', 'Sewer Backup', 'Smoke'],
  Auto: ['Collision', 'Comprehensive', 'Total Loss', 'Glass', 'Rear-End', 'Theft', 'Vandalism', 'Rental', 'UM/UIM', 'PIP', 'Hail', 'Towing'],
  Casualty: ['Slip & Fall', 'Dog Bite', 'Premises', 'Bodily Injury', 'Product', 'Medical Payments', 'Assault', 'Auto Liability', 'Construction Defect', 'Libel'],
}
const TIERS = ['Express', 'Standard', 'Complex', 'Litigated']
const SEGMENTS = ['Personal', 'Commercial']

const STATUS_STYLE: Record<FormStatus, string> = {
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Draft: 'bg-amber-50 text-amber-700 border-amber-200',
  Archived: 'bg-slate-100 text-slate-500 border-slate-200',
}

let uidCounter = 0
const uid = () => `q_${Date.now()}_${uidCounter++}`

// deterministic PRNG so the library is stable across reloads
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildLibrary(): ReviewForm[] {
  const rnd = mulberry32(424242)
  const forms: ReviewForm[] = []
  let n = 0
  for (const segment of SEGMENTS) {
    for (const line of LINES) {
      for (const scope of SCOPES[line]) {
        for (const tier of TIERS) {
          const r = rnd()
          const status: FormStatus = r < 0.72 ? 'Published' : r < 0.9 ? 'Draft' : 'Archived'
          const daysAgo = Math.floor(rnd() * 160)
          const d = new Date(2026, 5, 9)
          d.setDate(d.getDate() - daysAgo)
          forms.push({
            id: `form_${n++}`,
            name: `${segment} ${line} — ${scope} (${tier})`,
            line,
            scope,
            segment,
            status,
            version: 1 + Math.floor(rnd() * 4),
            updated: d.toISOString().slice(0, 10),
            // each form starts from the line's question spine
            questions: JSON.parse(JSON.stringify(QUESTIONNAIRES[line])) as Question[],
          })
        }
      }
    }
  }
  return forms
}

const PAGE_SIZE = 9

export default function QuestionnaireBuilder() {
  const [forms, setForms] = useState<ReviewForm[]>(buildLibrary)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = forms.find((f) => f.id === selectedId) || null

  function mutateForm(id: string, fn: (f: ReviewForm) => ReviewForm) {
    setForms((fs) => fs.map((f) => (f.id === id ? fn(f) : f)))
  }
  function createForm(line: Line) {
    const id = `form_new_${Date.now()}`
    setForms((fs) => [
      {
        id,
        name: `New ${line} Review Form`,
        line,
        scope: 'All perils',
        segment: 'Personal',
        status: 'Draft',
        version: 1,
        updated: '2026-06-09',
        questions: JSON.parse(JSON.stringify(QUESTIONNAIRES[line])) as Question[],
      },
      ...fs,
    ])
    setSelectedId(id)
  }
  function duplicateForm(src: ReviewForm) {
    const id = `form_dup_${Date.now()}`
    setForms((fs) => [
      { ...JSON.parse(JSON.stringify(src)), id, name: `${src.name} (copy)`, status: 'Draft' as FormStatus, version: 1, updated: '2026-06-09' },
      ...fs,
    ])
    setSelectedId(id)
  }

  if (selected) {
    return (
      <FormEditor
        form={selected}
        onBack={() => setSelectedId(null)}
        onMutate={(fn) => mutateForm(selected.id, fn)}
        onDuplicate={() => duplicateForm(selected)}
      />
    )
  }

  return <Library forms={forms} onOpen={setSelectedId} onNew={createForm} />
}

/* ----------------------------- Library ----------------------------- */

function Library({ forms, onOpen, onNew }: { forms: ReviewForm[]; onOpen: (id: string) => void; onNew: (line: Line) => void }) {
  const [line, setLine] = useState<'All' | Line>('All')
  const [status, setStatus] = useState<'All' | FormStatus>('All')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    return forms.filter((f) => {
      if (line !== 'All' && f.line !== line) return false
      if (status !== 'All' && f.status !== status) return false
      if (q && !`${f.name} ${f.scope} ${f.segment}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
  }, [forms, line, status, q])

  const counts = useMemo(() => {
    const byLine: Record<string, number> = { Property: 0, Auto: 0, Casualty: 0 }
    let published = 0
    for (const f of forms) {
      byLine[f.line]++
      if (f.status === 'Published') published++
    }
    return { byLine, published }
  }, [forms])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="Review Form Library"
          subtitle="Hundreds of review forms, each tied to a line of business, peril, segment, and complexity tier."
          right={
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
                <FileText size={16} className="text-brand-500" />
                <span className="font-semibold text-brand-950">{forms.length}</span> forms
              </div>
              <div className="relative group">
                <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-colors">
                  <Plus size={16} /> New form
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-brand-100 shadow-card p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {LINES.map((l) => (
                    <button key={l} onClick={() => onNew(l)} className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700">
                      {l} form
                    </button>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <Stat label="Total forms" value={`${forms.length}`} />
          <Stat label="Published" value={`${counts.published}`} />
          <Stat label="Property / Auto" value={`${counts.byLine.Property} / ${counts.byLine.Auto}`} />
          <Stat label="Casualty" value={`${counts.byLine.Casualty}`} />
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-white rounded-xl border border-brand-100 p-1 shadow-card">
            {(['All', ...LINES] as ('All' | Line)[]).map((l) => (
              <button key={l} onClick={() => { setLine(l); setPage(0) }} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${line === l ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-brand-700'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex bg-white rounded-xl border border-brand-100 p-1 shadow-card">
            {(['All', 'Published', 'Draft', 'Archived'] as ('All' | FormStatus)[]).map((s) => (
              <button key={s} onClick={() => { setStatus(s); setPage(0) }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === s ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-brand-700'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search forms…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-100 bg-white text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        {/* form grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {slice.map((f) => (
            <button key={f.id} onClick={() => onOpen(f.id)} className="text-left">
              <Card className="p-4 h-full hover:shadow-glow transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <LinePill line={f.line} />
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[f.status]}`}>{f.status}</span>
                </div>
                <div className="mt-2.5 font-bold text-brand-950 text-sm leading-snug">{f.name}</div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{f.questions.length} questions</span>
                  <span>·</span>
                  <span>v{f.version}</span>
                  <span className="ml-auto">{f.updated}</span>
                </div>
              </Card>
            </button>
          ))}
        </div>

        {filtered.length === 0 && <div className="text-center text-sm text-slate-400 py-16">No forms match your filters.</div>}

        {/* pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-5">
            <span className="text-sm text-slate-500">
              Showing <span className="font-semibold text-brand-950">{safePage * PAGE_SIZE + 1}–{Math.min(filtered.length, safePage * PAGE_SIZE + PAGE_SIZE)}</span> of{' '}
              <span className="font-semibold text-brand-950">{filtered.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} className="flex items-center gap-1 text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-lg border border-brand-100 bg-white disabled:opacity-40">
                <ChevronLeft size={15} /> Prev
              </button>
              <span className="text-sm text-slate-500 tabular-nums">
                {safePage + 1} / {pageCount}
              </span>
              <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1} className="flex items-center gap-1 text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-lg border border-brand-100 bg-white disabled:opacity-40">
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------- Form Editor --------------------------- */

function FormEditor({
  form,
  onBack,
  onMutate,
  onDuplicate,
}: {
  form: ReviewForm
  onBack: () => void
  onMutate: (fn: (f: ReviewForm) => ReviewForm) => void
  onDuplicate: () => void
}) {
  const [sample, setSample] = useState<Record<string, AnswerValue>>({})
  const [savedFlash, setSavedFlash] = useState(false)

  const questions = form.questions
  const totalWeight = useMemo(() => questions.reduce((s, q) => s + (q.weight || 0), 0), [questions])

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

  const setQuestions = (fn: (qs: Question[]) => Question[]) => onMutate((f) => ({ ...f, questions: fn(f.questions) }))
  const updateQ = (id: string, patch: Partial<Question>) => setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  const removeQ = (id: string) => setQuestions((qs) => qs.filter((q) => q.id !== id))
  const moveQ = (id: string, dir: -1 | 1) =>
    setQuestions((qs) => {
      const arr = [...qs]
      const i = arr.findIndex((q) => q.id === id)
      const j = i + dir
      if (j < 0 || j >= arr.length) return qs
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  const addQ = () => setQuestions((qs) => [...qs, { id: uid(), label: 'New question', prompt: 'Describe what the reviewer should verify…', category: 'Technical', weight: 1 }])
  const resetQ = () => onMutate((f) => ({ ...f, questions: JSON.parse(JSON.stringify(QUESTIONNAIRES[f.line])) }))
  const save = () => {
    onMutate((f) => ({ ...f, updated: '2026-06-09' }))
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-700 mb-4">
          <ArrowLeft size={16} /> All forms
        </button>

        {/* form metadata */}
        <Card className="p-5 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <input
                value={form.name}
                onChange={(e) => onMutate((f) => ({ ...f, name: e.target.value }))}
                className="text-xl font-extrabold text-brand-950 w-full border-b border-transparent hover:border-brand-200 focus:border-brand-500 focus:outline-none bg-transparent pb-1"
              />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Field label="Line">
                  <select value={form.line} onChange={(e) => onMutate((f) => ({ ...f, line: e.target.value as Line }))} className="text-sm font-semibold rounded-lg border border-brand-100 px-2 py-1.5 focus:outline-none">
                    {LINES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Segment">
                  <select value={form.segment} onChange={(e) => onMutate((f) => ({ ...f, segment: e.target.value }))} className="text-sm rounded-lg border border-brand-100 px-2 py-1.5 focus:outline-none">
                    {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Scope">
                  <input value={form.scope} onChange={(e) => onMutate((f) => ({ ...f, scope: e.target.value }))} className="text-sm rounded-lg border border-brand-100 px-2 py-1.5 w-36 focus:outline-none" />
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => onMutate((f) => ({ ...f, status: e.target.value as FormStatus }))} className="text-sm rounded-lg border border-brand-100 px-2 py-1.5 focus:outline-none">
                    {(['Published', 'Draft', 'Archived'] as FormStatus[]).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onDuplicate} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700 px-3 py-2 rounded-xl border border-brand-100 bg-white">
                <Copy size={15} /> Duplicate
              </button>
              <button onClick={resetQ} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700 px-3 py-2 rounded-xl border border-brand-100 bg-white">
                <RotateCcw size={15} /> Reset
              </button>
              <button onClick={save} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-colors">
                <Save size={15} /> {savedFlash ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
            <span className={`font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[form.status]}`}>{form.status}</span>
            <span>v{form.version}</span>
            <span>· {questions.length} questions · total weight {totalWeight.toFixed(1)}</span>
            <span>· updated {form.updated}</span>
          </div>
        </Card>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* editor column */}
          <div>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <Card key={q.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button onClick={() => moveQ(q.id, -1)} disabled={idx === 0} className="text-slate-300 hover:text-brand-600 disabled:opacity-30">
                        <ArrowUp size={15} />
                      </button>
                      <span className="text-xs font-bold text-slate-400 tabular-nums">{idx + 1}</span>
                      <button onClick={() => moveQ(q.id, 1)} disabled={idx === questions.length - 1} className="text-slate-300 hover:text-brand-600 disabled:opacity-30">
                        <ArrowDown size={15} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input value={q.label} onChange={(e) => updateQ(q.id, { label: e.target.value })} className="font-semibold text-brand-950 text-sm border-b border-transparent hover:border-brand-200 focus:border-brand-500 focus:outline-none px-1 py-0.5 bg-transparent" />
                        <select value={q.category} onChange={(e) => updateQ(q.id, { category: e.target.value })} className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-md px-2 py-1 focus:outline-none">
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 ml-auto">
                          weight
                          <input type="number" step={0.5} min={0} value={q.weight} onChange={(e) => updateQ(q.id, { weight: parseFloat(e.target.value) || 0 })} className="w-16 rounded-md border border-brand-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                        </div>
                        <button onClick={() => removeQ(q.id)} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea value={q.prompt} onChange={(e) => updateQ(q.id, { prompt: e.target.value })} rows={2} className="w-full text-sm text-slate-600 rounded-lg border border-brand-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-semibold">Sample answer:</span>
                        {ANSWER_VALUES.map((v) => {
                          const active = (sample[q.id] ?? 'yes') === v
                          return (
                            <button key={v} onClick={() => setSample((s) => ({ ...s, [q.id]: v }))} className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors ${active ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-brand-300'}`}>
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

            <button onClick={addQ} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-brand-200 text-brand-600 font-semibold text-sm hover:bg-brand-50/50 transition-colors">
              <Plus size={17} /> Add question
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ListChecks size={14} />
              Edits are a local draft of this form — saving would version it so existing scores stay reproducible.
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
                  <div className="text-xs text-slate-500 mt-1.5">From this form's weights and sample answers</div>
                </div>
              </div>
              <p className="mt-4 pt-4 border-t border-brand-50 text-xs text-slate-500 leading-relaxed">
                Adjust any <span className="font-semibold text-brand-950">weight</span> or <span className="font-semibold text-brand-950">sample answer</span> and this recomputes instantly. N/A items drop out of the denominator.
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-brand-950 tabular-nums">{value}</div>
    </Card>
  )
}
