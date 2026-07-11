import { Link } from 'react-router-dom'
import {
  ShieldCheck, Lock, KeyRound, Cpu, Users, ScrollText, Server, Globe, FileCheck,
  EyeOff, Network, AlertTriangle, Radar, ArrowLeft, Scale, Rocket, ClipboardCheck, BadgeCheck, Building2,
} from 'lucide-react'
import { Card, PageHeader } from '../components/ui'

/* ------------------------------------------------------------------ */
/*  Security Architecture — how carrier claim data (PII/PHI) is        */
/*  protected, with honest certification status + a compliance roadmap. */
/* ------------------------------------------------------------------ */

type Status = 'certified' | 'progress' | 'designed'

const STATUS_STYLE: Record<Status, { label: string; cls: string }> = {
  certified: { label: 'Certified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  progress: { label: 'In progress', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  designed: { label: 'Designed-to', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
}

function StatusBadge({ s }: { s: Status }) {
  const st = STATUS_STYLE[s]
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
}

const GROUPS: {
  group: string
  controls: { icon: any; title: string; body: string; status: Status }[]
}[] = [
  {
    group: 'Certifications & regulatory fit',
    controls: [
      { icon: FileCheck, title: 'SOC 2 Type II', body: 'The baseline trust attestation a large carrier requires before any data flows. Observation window under way.', status: 'progress' },
      { icon: BadgeCheck, title: 'ISO 27001', body: 'Information-security management system built to Annex A controls; certification audit to follow.', status: 'designed' },
      { icon: ShieldCheck, title: 'HIPAA / HITRUST', body: 'Claims carry PHI (medical specials, injuries). Handled under a BAA with HITRUST-aligned controls.', status: 'designed' },
      { icon: Scale, title: 'Insurance regulation', body: 'NAIC Insurance Data Security Model Law (Model 668), NYDFS 23 NYCRR 500, and GLBA Safeguards.', status: 'designed' },
      { icon: Globe, title: 'Privacy law', body: 'CCPA/CPRA and state privacy laws; GDPR where international data is in scope.', status: 'designed' },
      { icon: ClipboardCheck, title: 'NIST CSF / CIS Controls', body: 'Adopted as the control framework — the baseline the rest of the program maps to.', status: 'progress' },
    ],
  },
  {
    group: 'Data protection',
    controls: [
      { icon: Lock, title: 'Encryption everywhere', body: 'TLS 1.2+ in transit, AES-256 at rest, across every store and service.', status: 'designed' },
      { icon: KeyRound, title: 'Customer-managed keys (BYOK)', body: 'Bring-your-own-key via KMS so the carrier holds and can revoke the keys to their data.', status: 'designed' },
      { icon: EyeOff, title: 'Tokenization & field-level encryption', body: 'The most sensitive fields are tokenized or encrypted at the field level, not just the disk.', status: 'designed' },
      { icon: Scale, title: 'Minimization & de-identification', body: 'Collect only what a review needs; train and evaluate on de-identified data.', status: 'designed' },
    ],
  },
  {
    group: 'AI data handling — “where does our claim data go?”',
    controls: [
      { icon: Cpu, title: 'Private, no-retention inference', body: 'Claim data is read by private model endpoints under zero-retention, no-training agreements — customer data never trains a foundation model.', status: 'designed' },
      { icon: EyeOff, title: 'Redaction before inference', body: 'PII/PHI is redacted before prompts are built; retrieval pulls only the spans a question needs.', status: 'designed' },
      { icon: Network, title: 'Processing stays in-boundary', body: 'Inference runs inside the tenant boundary; nothing is logged or egressed to a third party.', status: 'designed' },
    ],
  },
  {
    group: 'Identity, access & auditability',
    controls: [
      { icon: Users, title: 'SSO/SAML + SCIM, MFA', body: 'Enterprise identity, automated provisioning/deprovisioning, and enforced multi-factor auth.', status: 'designed' },
      { icon: ShieldCheck, title: 'RBAC + row-level security', body: 'Least-privilege roles and row-level data scoping — demonstrated in the product today.', status: 'progress' },
      { icon: ScrollText, title: 'Immutable audit trail', body: 'Tamper-evident log of every access, assignment, review, and model decision — demonstrated in the product today.', status: 'progress' },
    ],
  },
  {
    group: 'Tenancy & deployment',
    controls: [
      { icon: Server, title: 'Deploy in your cloud', body: 'Multi-tenant SaaS, dedicated single-tenant, or deploy into the carrier’s own VPC / cloud account.', status: 'designed' },
      { icon: Globe, title: 'Data residency', body: 'Pin storage and processing to required regions to satisfy residency and sovereignty rules.', status: 'designed' },
    ],
  },
  {
    group: 'Operational security',
    controls: [
      { icon: Radar, title: 'Continuous assurance', body: 'SAST/DAST, dependency and secrets scanning, network segmentation + WAF, and regular third-party penetration tests.', status: 'designed' },
      { icon: AlertTriangle, title: 'Resilience & response', body: 'SIEM monitoring, a documented incident-response plan with breach-notification SLAs, and backups + DR/BCP.', status: 'designed' },
    ],
  },
]

const ROADMAP: { icon: any; phase: string; window: string; title: string; items: string[] }[] = [
  {
    icon: ClipboardCheck, phase: 'Phase 1', window: '0–3 months', title: 'Foundation',
    items: ['Adopt NIST CSF / ISO 27001 as the control framework', 'Core controls: encryption, RBAC, MFA, SSO, immutable audit', 'DPA + BAA templates; sub-processor list'],
  },
  {
    icon: Radar, phase: 'Phase 2', window: '3–6 months', title: 'Automate & attest',
    items: ['Compliance-automation platform (Vanta / Drata / Comp AI)', 'SOC 2 Type I; first third-party penetration test', 'Incident-response plan + DR/BCP'],
  },
  {
    icon: BadgeCheck, phase: 'Phase 3', window: '6–12 months', title: 'Certify',
    items: ['SOC 2 Type II (observation window)', 'ISO 27001 certification audit', 'HIPAA / HITRUST for PHI'],
  },
  {
    icon: Building2, phase: 'Phase 4', window: '12 months+', title: 'Carrier-grade',
    items: ['Deploy-in-your-cloud / VPC + BYOK', 'NAIC 668 / NYDFS 500 alignment; right-to-audit', 'Continuous monitoring & annual re-certification'],
  },
]

export default function Security() {
  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Link to="/how-it-works" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-700 mb-4">
          <ArrowLeft size={16} /> Vision
        </Link>
        <PageHeader
          title="Security & Data Architecture"
          subtitle="How carrier claim data — including PII and PHI — is protected end to end, from ingestion through AI inference to audit."
          right={
            <div className="flex items-center gap-2">
              <StatusBadge s="certified" />
              <StatusBadge s="progress" />
              <StatusBadge s="designed" />
            </div>
          }
        />

        <div className="space-y-6">
          {GROUPS.map((g) => (
            <div key={g.group}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2 ml-1">{g.group}</div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {g.controls.map((c) => {
                  const Icon = c.icon
                  return (
                    <Card key={c.title} className="p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
                          <Icon size={19} />
                        </div>
                        <StatusBadge s={c.status} />
                      </div>
                      <div className="mt-3 font-bold text-brand-950">{c.title}</div>
                      <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed flex-1">{c.body}</p>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* compliance roadmap */}
        <div className="mt-8 mb-3 flex items-center gap-2">
          <Rocket size={18} className="text-brand-600" />
          <h2 className="font-extrabold text-brand-950">Compliance roadmap</h2>
          <span className="text-xs text-slate-400">framework → controls → automation → audit</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROADMAP.map((p) => {
            const Icon = p.icon
            return (
              <Card key={p.phase} className="p-5 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center shadow-glow">
                    <Icon size={17} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{p.window}</span>
                </div>
                <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-brand-600">{p.phase}</div>
                <div className="font-bold text-brand-950">{p.title}</div>
                <ul className="mt-2 space-y-1.5">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-1.5 text-[12px] text-slate-500 leading-snug">
                      <span className="w-1 h-1 rounded-full bg-brand-300 mt-1.5 shrink-0" />
                      {it}
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>

        {/* closing thesis */}
        <Card className="mt-6 p-6 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-0">
          <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-wide">
            <ShieldCheck size={14} /> The question every carrier asks
          </div>
          <p className="mt-3 text-[15px] leading-relaxed max-w-3xl">
            “Where does our claim data go when the AI reads it?” The answer here is: into <span className="font-bold text-white">private, no-retention inference inside your boundary</span>, on
            <span className="font-bold text-white"> de-identified</span> data, under <span className="font-bold text-white">your keys</span>, with every action on an
            <span className="font-bold text-white"> immutable audit trail</span> — deployable in <span className="font-bold text-white">your own cloud</span>. Security and governance are the product, not an add-on.
          </p>
          <p className="mt-3 text-[12px] text-brand-100/60 max-w-3xl">
            Status reflects program maturity — “Designed-to” means architected to the standard; “In progress” means actively being implemented or audited; “Certified” is claimed only after a completed third-party audit.
          </p>
        </Card>
      </div>
    </div>
  )
}
