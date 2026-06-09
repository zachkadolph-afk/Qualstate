import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Check,
  X,
  FileText,
  Clock,
  Users,
  ChevronRight,
  ShieldCheck,
  Quote,
  Gauge,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Card, LinePill, SeverityChip, ScoreRing } from '../components/ui'
import { ANSWER_LABEL, QUESTIONNAIRES } from '../data/questions'
import { AnswerValue, ReviewerAnswer } from '../data/types'
import { computeReview, currency, scoreBand } from '../lib/scoring'
import { Claim } from '../data/types'

const VALUE_STYLE: Record<AnswerValue, { ring: string; text: string; dot: string }> = {
  yes: { ring: 'border-emerald-300 bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  partial: { ring: 'border-amber-300 bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  no: { ring: 'border-red-300 bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  na: { ring: 'border-slate-300 bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
}

export default function Review() {
  const { id } = useParams()
  const { getClaim } = useStore()
  const claim = id ? getClaim(id) : undefined

  if (!claim) {
    return (
      <div className="p-10">
        <p>Claim not found.</p>
        <Link to="/queue" className="text-brand-600">
          Back to queue
        </Link>
      </div>
    )
  }
  return <ReviewInner claim={claim} />
}

function ReviewInner({ claim }: { claim: Claim }) {
  const navigate = useNavigate()
  const { submitReview, reviewer, getFormForClaim } = useStore()
  const [answers, setAnswers] = useState<Record<string, ReviewerAnswer>>({})

  // the form this claim is reviewed against (coordinated). Only show questions
  // that have a matching AI answer so display + scoring stay consistent.
  const form = getFormForClaim(claim)
  const questions = (form?.questions ?? QUESTIONNAIRES[claim.line]).filter((q) =>
    claim.agentAnswers.some((a) => a.questionId === q.id),
  )
  const result = useMemo(() => computeReview(claim, answers), [claim, answers])
  const answered = Object.values(answers).filter((a) => a.decision).length
  const allAnswered = answered === questions.length
  const band = scoreBand(result.qualityScore)

  function setDecision(qid: string, decision: 'agree' | 'disagree') {
    setAnswers((prev) => {
      const existing = prev[qid]
      if (existing?.decision === decision) {
        const { [qid]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [qid]: { questionId: qid, decision, correctedValue: existing?.correctedValue, note: existing?.note } }
    })
  }
  function setCorrected(qid: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], questionId: qid, decision: 'disagree', correctedValue: value } }))
  }
  function setNote(qid: string, note: string) {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], questionId: qid, decision: 'disagree', note } }))
  }

  function handleSubmit() {
    submitReview({
      claimId: claim.id,
      reviewer,
      completedAt: new Date().toISOString().slice(0, 10),
      reviewerAnswers: questions.map((q) => answers[q.id] || { questionId: q.id, decision: 'agree' }),
      qualityScore: result.qualityScore,
      agentScore: result.agentScore,
      calibration: result.calibration,
      formId: form?.id,
      reviewType: form?.reviewType,
    })
    navigate('/dashboard')
  }

  return (
    <div className="bg-grid min-h-screen pb-28">
      {/* top bar */}
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/queue')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-700"
          >
            <ArrowLeft size={16} /> Queue
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-brand-950">{claim.claimNumber}</span>
            <LinePill line={claim.line} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-7 grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-7">
        {/* ---------------- main column ---------------- */}
        <div className="space-y-6 min-w-0">
          {/* claim header */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-extrabold text-brand-950">{claim.perilType}</h1>
                  <SeverityChip severity={claim.severity} />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {claim.insured} · Policy {claim.policyNumber} · {claim.state}
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-slate-400 text-xs">Reserve</div>
                  <div className="font-bold text-brand-950">{currency(claim.reserveAmount)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Paid</div>
                  <div className="font-bold text-brand-950">{currency(claim.paidAmount)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Adjuster</div>
                  <div className="font-bold text-brand-950">{claim.adjuster}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* STAGE 1 — the one-pager */}
          <div>
            <StageLabel n={1} title="Review the file" sub="The story of this claim, on one page." />
            <Card className="p-6">
              <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm mb-3">
                <FileText size={16} /> Claim Summary
              </div>
              <p className="text-[15px] leading-relaxed text-slate-700">{claim.summary}</p>

              {/* fact chips */}
              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                {claim.facts.map((f) => (
                  <div key={f.label} className="rounded-xl border border-brand-100 bg-brand-50/40 px-3.5 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                      {f.label}
                    </div>
                    <div className="text-sm font-semibold text-brand-950 mt-0.5">{f.value}</div>
                  </div>
                ))}
              </div>

              {/* timeline + parties */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
                    <Clock size={14} /> File Timeline
                  </div>
                  <ol className="relative border-l border-brand-100 ml-1.5 space-y-3">
                    {claim.timeline.map((t, i) => (
                      <li key={i} className="ml-4">
                        <div className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-brand-400" />
                        <div className="text-xs text-slate-400">{t.date}</div>
                        <div className="text-sm text-slate-700">{t.event}</div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wide mb-3">
                    <Users size={14} /> Parties
                  </div>
                  <div className="space-y-2">
                    {claim.parties.map((p) => (
                      <div key={p.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                        <span className="text-xs text-slate-500">{p.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* STAGE 2 — calibration questions */}
          <div>
            <StageLabel
              n={2}
              title="Validate the AI first-pass"
              sub="Agree or disagree with each answer. Disagreements train the model."
            />
            {form && (
              <div className="mb-3 flex items-center gap-2 text-xs flex-wrap">
                <span className="flex items-center gap-1.5 bg-brand-50 text-brand-700 font-semibold px-2.5 py-1 rounded-full">
                  <FileText size={12} /> {form.name}
                </span>
                <span className={`font-semibold px-2.5 py-1 rounded-full ${form.reviewType === 'Targeted' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'}`}>
                  {form.reviewType === 'Targeted' ? 'Real-time (targeted)' : 'Outcome-based (diagnostic)'}
                </span>
              </div>
            )}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const agent = claim.agentAnswers.find((a) => a.questionId === q.id)!
                const rev = answers[q.id]
                const vs = VALUE_STYLE[agent.value]
                return (
                  <Card key={q.id} className="overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-7 h-7 rounded-lg bg-brand-50 text-brand-700 grid place-items-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {q.category}
                            </span>
                          </div>
                          <p className="text-[15px] font-semibold text-brand-950 mt-0.5">{q.prompt}</p>

                          {/* agent answer block */}
                          <div className={`mt-3 rounded-xl border ${vs.ring} p-3.5`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Sparkles size={15} className="text-brand-600" />
                                <span className="text-xs font-semibold text-slate-500">AI Agent answered</span>
                                <span className={`text-sm font-bold ${vs.text}`}>
                                  {ANSWER_LABEL[agent.value]}
                                </span>
                              </div>
                              <ConfidenceBadge value={agent.confidence} />
                            </div>
                            <p className="text-sm text-slate-700 mt-2 leading-relaxed">{agent.rationale}</p>
                            {agent.evidence.length > 0 && agent.evidence[0] !== 'N/A' && (
                              <div className="mt-2.5 space-y-1.5">
                                {agent.evidence.map((e, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500 bg-white/70 rounded-md px-2 py-1.5">
                                    <Quote size={12} className="mt-0.5 shrink-0 text-slate-300" />
                                    <span className="italic">{e}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* reviewer controls */}
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => setDecision(q.id, 'agree')}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                                rev?.decision === 'agree'
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                              }`}
                            >
                              <Check size={15} /> Agree
                            </button>
                            <button
                              onClick={() => setDecision(q.id, 'disagree')}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                                rev?.decision === 'disagree'
                                  ? 'bg-red-600 border-red-600 text-white'
                                  : 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700'
                              }`}
                            >
                              <X size={15} /> Disagree
                            </button>
                            {rev?.decision === 'agree' && (
                              <span className="text-xs text-emerald-600 font-medium ml-1">
                                Validated · counts toward AI calibration
                              </span>
                            )}
                          </div>

                          {/* disagree expansion */}
                          {rev?.decision === 'disagree' && (
                            <div className="mt-3 rounded-xl border border-red-200 bg-red-50/50 p-3.5 animate-fadeup">
                              <div className="text-xs font-semibold text-red-700 mb-2">
                                Correct the answer — this becomes model training signal
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {(['yes', 'partial', 'no', 'na'] as AnswerValue[]).map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => setCorrected(q.id, v)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                      rev.correctedValue === v
                                        ? 'bg-brand-600 border-brand-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                                    }`}
                                  >
                                    {ANSWER_LABEL[v]}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                value={rev.note || ''}
                                onChange={(e) => setNote(q.id, e.target.value)}
                                placeholder="Why do you disagree? (e.g., 'Subro referral was actually made on 4/14, see note')"
                                className="mt-2.5 w-full text-sm rounded-lg border border-red-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* ---------------- right rail ---------------- */}
        <div className="lg:sticky lg:top-[68px] h-fit space-y-4">
          <Card className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Live Quality Score
            </div>
            <div className="flex items-center gap-4">
              <ScoreRing score={result.qualityScore} size={84} stroke={9} />
              <div>
                <div
                  className="text-sm font-bold px-2.5 py-1 rounded-full inline-block"
                  style={{ color: band.color, background: band.bg }}
                >
                  {band.label}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">Reviewer-validated final score</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-brand-100 space-y-3">
              <RailStat
                icon={Sparkles}
                label="AI-only score"
                value={`${result.agentScore}`}
                hint="What the agent scored alone"
              />
              <RailStat
                icon={Gauge}
                label="AI calibration"
                value={result.scored ? `${result.calibration}%` : '—'}
                hint={`${result.agreements} agreed · ${result.disagreements} corrected`}
                accent
              />
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">
                    {answered}/{questions.length}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${(answered / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`w-full rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              allAnswered
                ? 'bg-accent-500 hover:bg-accent-600 text-white shadow-glow'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {allAnswered ? (
              <>
                <ShieldCheck size={18} /> Finalize Quality Score
              </>
            ) : (
              <>
                Answer all {questions.length} to finalize <ChevronRight size={16} />
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 px-2">
            Calibration deltas feed the model nightly to improve per-question reliability.
          </p>
        </div>
      </div>
    </div>
  )
}

function StageLabel({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-xl bg-brand-600 text-white grid place-items-center font-extrabold text-sm shadow-glow">
        {n}
      </div>
      <div>
        <h2 className="font-extrabold text-brand-950 leading-none">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>
    </div>
  )
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const low = value < 0.7
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        low ? 'bg-accent-100 text-accent-600' : 'bg-brand-50 text-brand-600'
      }`}
      style={low ? { background: '#ffedd9' } : {}}
      title="Model self-reported confidence"
    >
      {pct}% confidence{low ? ' · review closely' : ''}
    </span>
  )
}

function RailStat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: any
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-lg grid place-items-center ${
          accent ? 'bg-accent-100 text-accent-600' : 'bg-brand-50 text-brand-600'
        }`}
        style={accent ? { background: '#ffedd9' } : {}}
      >
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-brand-950">
          {value} <span className="text-xs font-medium text-slate-500">{label}</span>
        </div>
        <div className="text-[11px] text-slate-400">{hint}</div>
      </div>
    </div>
  )
}
