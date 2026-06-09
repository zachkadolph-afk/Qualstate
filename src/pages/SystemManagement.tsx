import { Link } from 'react-router-dom'
import { ListChecks, GitBranch, Users, Filter, ScrollText, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../lib/store'

/* ------------------------------------------------------------------ */
/*  System Management — a single hub for the administrative tools, so  */
/*  they don't clutter the reviewer/manager navigation. Admin only.    */
/* ------------------------------------------------------------------ */

const GROUPS: {
  group: string
  tools: { to: string; icon: any; title: string; body: string }[]
}[] = [
  {
    group: 'Review configuration',
    tools: [
      { to: '/questionnaire', icon: ListChecks, title: 'Questionnaire Builder', body: 'Build and version the review forms — questions, weights, categories, and review type — per line of business.' },
      { to: '/rules', icon: GitBranch, title: 'Assignment Rules', body: 'Map claim attributes (line, peril, segment, review type) to the right form and team. First match wins.' },
    ],
  },
  {
    group: 'Operations',
    tools: [
      { to: '/sampling', icon: Filter, title: 'Sampling & Assignment', body: 'Drill the book by LOB, sub-segment, and team; split into Diagnostic and Targeted cohorts; assign files.' },
    ],
  },
  {
    group: 'Access & governance',
    tools: [
      { to: '/users', icon: Users, title: 'User Management', body: 'Reviewers, leads, and managers — roles, teams, and SSO provisioning.' },
      { to: '/audit', icon: ScrollText, title: 'Audit Trail', body: 'Immutable log of assignments, reviews, rule and user changes — full traceability for compliance.' },
    ],
  },
]

export default function SystemManagement() {
  const { currentUser } = useStore()

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="System Management"
          subtitle="Administrative configuration for the quality program — separate from the day-to-day reviewer tools."
          right={
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white rounded-xl border border-brand-100 px-3 py-2 shadow-card">
              <SlidersHorizontal size={16} className="text-brand-500" />
              {currentUser?.role ?? 'Admin'}
            </div>
          }
        />

        <div className="space-y-6">
          {GROUPS.map((g) => (
            <div key={g.group}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2 ml-1">{g.group}</div>
              <div className="grid md:grid-cols-2 gap-4">
                {g.tools.map((t) => {
                  const Icon = t.icon
                  return (
                    <Link key={t.to} to={t.to}>
                      <Card className="p-5 h-full hover:shadow-glow transition-shadow cursor-pointer group">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                            <Icon size={21} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-bold text-brand-950">{t.title}</h3>
                              <ArrowRight size={17} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{t.body}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
