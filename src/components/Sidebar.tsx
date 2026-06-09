import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import Logo from './Logo'
import { useStore } from '../lib/store'

const links = [
  { to: '/dashboard', label: 'Quality Dashboard', icon: LayoutDashboard },
  { to: '/queue', label: 'Review Queue', icon: ClipboardCheck },
  { to: '/how-it-works', label: 'Vision', icon: Workflow },
]

export default function Sidebar() {
  const { reviewClaims, reviewer } = useStore()

  return (
    <aside className="w-[248px] shrink-0 bg-brand-950 text-white flex flex-col sticky top-0 h-screen">
      <div className="px-5 py-5 border-b border-white/10">
        <Logo light />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {links.map((l) => {
          const Icon = l.icon
          return (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-brand-700 shadow-glow'
                    : 'text-brand-100/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{l.label}</span>
              {l.to === '/queue' && reviewClaims.length > 0 && (
                <span className="ml-auto text-[11px] font-bold bg-accent-500 text-white rounded-full px-2 py-0.5">
                  {reviewClaims.length}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 pb-4 space-y-3">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-2 text-accent-400 text-xs font-semibold">
            <Sparkles size={14} /> AI Calibration Active
          </div>
          <p className="text-[11px] text-brand-100/60 mt-1 leading-snug">
            Every disagreement retrains the question models.
          </p>
        </div>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 grid place-items-center text-white font-bold text-sm">
            {reviewer.replace(/[^A-Z]/g, '').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{reviewer}</div>
            <div className="text-[11px] text-brand-100/60 flex items-center gap-1">
              <ShieldCheck size={11} /> Senior QA Reviewer
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
