import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  FileInput,
  Sparkles,
  UserCheck,
  RefreshCw,
  BarChart3,
  ChevronRight,
  ChevronDown,
  ListChecks,
  Users,
  Plug,
  ShieldCheck,
  Filter,
  GraduationCap,
  Cpu,
  ArrowRight,
} from 'lucide-react'
import { Card, PageHeader } from '../components/ui'

/* ------------------------------------------------------------------ */
/*  Standalone "How It Works" vision page. Purely additive — it imports */
/*  only shared UI and does not touch the dashboard, queue, or review.  */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: FileInput,
    title: 'Claim Intake',
    body: 'Every settled claim file — notes, documents, and structured data — flows in from the claims system of record.',
  },
  {
    icon: Cpu,
    title: 'AI First-Pass',
    body: 'The agent answers every quality question with a rationale, cited file evidence, and a self-reported confidence score.',
  },
  {
    icon: UserCheck,
    title: 'Reviewer Validation',
    body: 'A QA reviewer agrees or disagrees with each finding and corrects the answer where the AI got it wrong.',
  },
  {
    icon: RefreshCw,
    title: 'Calibration & Feedback',
    body: 'Disagreements become labeled training signal; per-question reliability is tracked and fed back to the model.',
  },
  {
    icon: BarChart3,
    title: 'Score & Report',
    body: 'A reviewer-validated quality score, dashboards, and adjuster scorecards drive coaching and remediation.',
  },
]

const MODULE_GROUPS: {
  group: string
  modules: { icon: any; title: string; body: string }[]
}[] = [
  {
    group: 'The engine',
    modules: [
      {
        icon: Cpu,
        title: 'AI First-Pass Engine',
        body: 'Ingests the claim file and answers the questionnaire with grounded rationale, evidence citations, and calibrated confidence — every finding defensible against the file.',
      },
      {
        icon: UserCheck,
        title: 'Human Validation & Feedback',
        body: 'Reviewers agree or disagree per finding and submit corrections. R1/R2 double-review and inter-rater agreement establish reviewer trust before the AI is measured against them.',
      },
      {
        icon: RefreshCw,
        title: 'Calibration & Model Loop',
        body: 'Turns corrections into a labeling store that continuously improves the model and tracks per-question reliability and drift over time.',
      },
    ],
  },
  {
    group: 'Configuration & access',
    modules: [
      {
        icon: ListChecks,
        title: 'Questionnaire Builder',
        body: 'Admin control over questions, weights, categories, and scoring bands — with versioning (scores reproduce against the questionnaire in force) and per-line / per-peril / per-state templates.',
      },
      {
        icon: Users,
        title: 'User Management & SSO',
        body: 'Enterprise SSO/SAML, role-based access (reviewer / lead / manager / admin), and team hierarchy.',
      },
    ],
  },
  {
    group: 'Data & trust',
    modules: [
      {
        icon: Plug,
        title: 'Claims System Integration',
        body: 'Native connectors to the system of record (e.g., Guidewire ClaimCenter, Duck Creek) pull claim files and push results — no manual loading.',
      },
      {
        icon: ShieldCheck,
        title: 'Governance, Audit & Compliance',
        body: 'Immutable audit trail, access controls, encryption, and PII/PHI handling aligned to SOC 2 and NAIC market-conduct / state-DOI expectations.',
      },
    ],
  },
  {
    group: 'Operations',
    modules: [
      {
        icon: Filter,
        title: 'Sampling & Assignment',
        body: 'Selects which claims get reviewed — random %, risk-based targeting, or full population — and routes them to reviewers with SLAs.',
      },
      {
        icon: GraduationCap,
        title: 'Coaching & Dispute Loop',
        body: 'Closes the loop: adjuster coaching and remediation, score dispute/appeal, and calibration sessions so findings drive real change.',
      },
      {
        icon: BarChart3,
        title: 'Reporting & Scorecards',
        body: 'Quality and calibration trends plus by-adjuster / team / line / state scorecards, exports, and scheduled reports.',
      },
    ],
  },
]

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const Icon = step.icon
  return (
    <Card className="flex-1 min-w-0 p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center shadow-glow">
          <Icon size={18} />
        </div>
        <span className="text-2xl font-extrabold text-brand-100">{index + 1}</span>
      </div>
      <div className="mt-3 font-bold text-brand-950 leading-tight">{step.title}</div>
      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed flex-1">{step.body}</p>
    </Card>
  )
}

function Connector() {
  return (
    <div className="flex lg:flex-col items-center justify-center shrink-0 text-brand-300">
      <ChevronRight size={20} className="hidden lg:block" />
      <ChevronDown size={20} className="lg:hidden" />
    </div>
  )
}

export default function HowItWorks() {
  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <PageHeader
          title="The Qualstate Vision"
          subtitle="AI reviews every claim first. Your experts calibrate it. Quality assurance becomes a continuously improving system."
          right={
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-colors"
            >
              See it live <ArrowRight size={16} />
            </Link>
          }
        />

        {/* ---------------- the pipeline ---------------- */}
        <div className="mb-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white grid place-items-center font-extrabold text-sm shadow-glow">
            1
          </div>
          <div>
            <h2 className="font-extrabold text-brand-950 leading-none">The quality loop</h2>
            <p className="text-xs text-slate-500 mt-1">Every claim flows through five stages — and the loop feeds itself.</p>
          </div>
        </div>

        <Card className="p-6 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
            {STEPS.map((s, i) => (
              <Fragment key={s.title}>
                <StepCard step={s} index={i} />
                {i < STEPS.length - 1 && <Connector />}
              </Fragment>
            ))}
          </div>

          {/* feedback loop callout */}
          <div className="mt-5 rounded-xl border border-dashed border-accent-400/60 px-4 py-3 flex items-center gap-3" style={{ background: '#fff6ed' }}>
            <div className="w-9 h-9 rounded-lg grid place-items-center text-accent-600 shrink-0" style={{ background: '#ffedd9' }}>
              <RefreshCw size={17} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-brand-950">Closed feedback loop:</span> reviewer corrections from
              stage 3 flow back into the model, improving per-question reliability over time — so the AI gets measurably
              better on exactly the questions it gets wrong today.
            </p>
          </div>
        </Card>

        {/* ---------------- modules ---------------- */}
        <div className="mb-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white grid place-items-center font-extrabold text-sm shadow-glow">
            2
          </div>
          <div>
            <h2 className="font-extrabold text-brand-950 leading-none">The modules</h2>
            <p className="text-xs text-slate-500 mt-1">The capabilities that make it a deployable, enterprise-grade program.</p>
          </div>
        </div>

        <div className="space-y-5">
          {MODULE_GROUPS.map((g) => (
            <div key={g.group}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2 ml-1">{g.group}</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {g.modules.map((m) => {
                  const Icon = m.icon
                  return (
                    <Card key={m.title} className="p-5 flex flex-col">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
                        <Icon size={19} />
                      </div>
                      <div className="mt-3 font-bold text-brand-950">{m.title}</div>
                      <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed flex-1">{m.body}</p>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ---------------- closing vision ---------------- */}
        <Card className="mt-5 p-6 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-0">
          <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-wide">
            <Sparkles size={14} /> The vision
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-3xl">
            Every claim reviewed, not just a sample. The AI does the first pass on the full population, your experts
            calibrate it on the cases that matter, and the model compounds — turning claims quality assurance into a
            <span className="font-bold text-white"> continuously improving system</span>, wrapped in the
            <span className="font-bold text-white"> governance</span> your compliance team requires.
          </p>
        </Card>
      </div>
    </div>
  )
}
