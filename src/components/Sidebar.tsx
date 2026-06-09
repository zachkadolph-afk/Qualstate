import { NavLink } from 'react-router-dom'
import { ClipboardCheck, ShieldCheck, Sparkles, Workflow, BarChart3, RotateCcw, GraduationCap, SlidersHorizontal } from 'lucide-react'
import Logo from './Logo'
import { useStore } from '../lib/store'
import { canConfigure } from '../data/users'

const links = [
  { to: '/queue', label: 'Reviews', icon: ClipboardCheck, config: false },
  { to: '/results', label: 'Results', icon: BarChart3, config: false },
  { to: '/coaching', label: 'Coaching & Disputes', icon: GraduationCap, config: false },
  { to: '/system', label: 'System Management', icon: SlidersHorizontal, config: true },
  { to: '/how-it-works', label: 'Vision', icon: Workflow, config: false },
]

export default function Sidebar() {
  const { reviewClaims, currentUser, resetDemo } = useStore()
  const isAdmin = canConfigure(currentUser)
  const visibleLinks = links.filter((l) => !l.config || isAdmin)

  return (
    <aside className="w-[248px] shrink-0 bg-brand-950 text-white flex flex-col sticky top-0 h-screen">
      <div className="px-5 py-5 border-b border-white/10">
        <Logo light />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {visibleLinks.map((l) => {
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
            {(currentUser?.name ?? '').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{currentUser?.name ?? 'Reviewer'}</div>
            <div className="text-[11px] text-brand-100/60 flex items-center gap-1">
              <ShieldCheck size={11} /> {currentUser?.role ?? 'Reviewer'}
            </div>
          </div>
        </div>
        <button
          onClick={resetDemo}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-brand-100/50 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <RotateCcw size={12} /> Reset demo data
        </button>
      </div>
    </aside>
  )
}
