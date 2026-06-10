import { Link } from 'react-router-dom'
import {
  ShieldCheck, Lock, KeyRound, Cpu, Users, ScrollText, Server, Globe, FileCheck,
  EyeOff, Network, AlertTriangle, Radar, ArrowLeft, Scale,
} from 'lucide-react'
import { Card, PageHeader } from '../components/ui'

/* ------------------------------------------------------------------ */
/*  Security Architecture — how carrier claim data (PII/PHI) is        */
/*  protected. Styled like the Vision page; reachable from it.          */
/* ------------------------------------------------------------------ */

const GROUPS: {
  group: string
  controls: { icon: any; title: string; body: string }[]
}[] = [
  {
    group: 'Certifications & regulatory fit',
    controls: [
      { icon: FileCheck, title: 'SOC 2 Type II & ISO 27001', body: 'The baseline trust attestations a large carrier requires before any data flows.' },
      { icon: ShieldCheck, title: 'HIPAA / HITRUST', body: 'Claims carry PHI (medical specials, injuries). Handled under a BAA with HITRUST-aligned controls.' },
      { icon: Scale, title: 'Insurance regulation', body: 'NAIC Insurance Data Security Model Law (Model 668), NYDFS 23 NYCRR 500, and GLBA Safeguards.' },
      { icon: Globe, title: 'Privacy law', body: 'CCPA/CPRA and state privacy laws; GDPR where international data is in scope.' },
    ],
  },
  {
    group: 'Data protection',
    controls: [
      { icon: Lock, title: 'Encryption everywhere', body: 'TLS 1.2+ in transit, AES-256 at rest, across every store and service.' },
      { icon: KeyRound, title: 'Customer-managed keys (BYOK)', body: 'Bring-your-own-key via KMS so the carrier holds and can revoke the keys to their data.' },
      { icon: EyeOff, title: 'Tokenization & field-level encryption', body: 'The most sensitive fields are tokenized or encrypted at the field level, not just the disk.' },
      { icon: Scale, title: 'Minimization & de-identification', body: 'Collect only what a review needs; train and evaluate on de-identified data.' },
    ],
  },
  {
    group: 'AI data handling — “where does our claim data go?”',
    controls: [
      { icon: Cpu, title: 'Private, no-retention inference', body: 'Claim data is read by private model endpoints under zero-retention, no-training agreements — customer data never trains a foundation model.' },
      { icon: EyeOff, title: 'Redaction before inference', body: 'PII/PHI is redacted before prompts are built; retrieval pulls only the spans a question needs.' },
      { icon: Network, title: 'Processing stays in-boundary', body: 'Inference runs inside the tenant boundary; nothing is logged or egressed to a third party.' },
    ],
  },
  {
    group: 'Identity, access & auditability',
    controls: [
      { icon: Users, title: 'SSO/SAML + SCIM, MFA', body: 'Enterprise identity, automated provisioning/deprovisioning, and enforced multi-factor auth.' },
      { icon: ShieldCheck, title: 'RBAC + row-level security', body: 'Least-privilege roles, row-level data scoping, and just-in-time admin access.' },
      { icon: ScrollText, title: 'Immutable audit trail', body: 'Tamper-evident log of every access, assignment, review, and model-update decision — exportable for examiners.' },
    ],
  },
  {
    group: 'Tenancy & deployment',
    controls: [
      { icon: Server, title: 'Deploy in your cloud', body: 'Multi-tenant SaaS, dedicated single-tenant, or deploy into the carrier’s own VPC / cloud account.' },
      { icon: Globe, title: 'Data residency', body: 'Pin storage and processing to required regions to satisfy residency and sovereignty rules.' },
    ],
  },
  {
    group: 'Operational security',
    controls: [
      { icon: Radar, title: 'Continuous assurance', body: 'SAST/DAST, dependency and secrets scanning, network segmentation + WAF, and regular third-party penetration tests.' },
      { icon: AlertTriangle, title: 'Resilience & response', body: 'SIEM monitoring, a documented incident-response plan with breach-notification SLAs, and backups + DR/BCP.' },
    ],
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
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <ShieldCheck size={16} className="text-brand-500" /> Enterprise-grade
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
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
                        <Icon size={19} />
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
        </Card>
      </div>
    </div>
  )
}
