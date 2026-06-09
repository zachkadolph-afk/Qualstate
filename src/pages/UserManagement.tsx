import { useMemo, useState } from 'react'
import { UserPlus, ShieldCheck, KeyRound, Search, Circle } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../lib/store'
import { Role, UserStatus, ROLES, TEAMS, Team } from '../data/users'

/* ------------------------------------------------------------------ */
/*  User Management — now reads/writes the shared store, so roles and  */
/*  the reviewer pool are coordinated with login and assignment.       */
/* ------------------------------------------------------------------ */

const ROLE_STYLE: Record<Role, string> = {
  Reviewer: 'bg-brand-50 text-brand-700 border-brand-200',
  Manager: 'bg-amber-50 text-amber-700 border-amber-200',
  'System Manager': 'bg-slate-800 text-white border-slate-800',
}
const STATUS_DOT: Record<UserStatus, string> = {
  Active: 'text-emerald-500',
  Invited: 'text-amber-500',
  Disabled: 'text-slate-300',
}

export default function UserManagement() {
  const { users, addUser, updateUser, currentUser } = useStore()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'All' | Role>('All')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('Reviewer')

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (roleFilter !== 'All' && u.role !== roleFilter) return false
        if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false
        return true
      }),
    [users, q, roleFilter],
  )

  const counts = useMemo(() => {
    const active = users.filter((u) => u.status === 'Active').length
    const invited = users.filter((u) => u.status === 'Invited').length
    const admins = users.filter((u) => u.role === 'System Manager' || u.role === 'Manager').length
    return { active, invited, admins }
  }, [users])

  function sendInvite() {
    const email = inviteEmail.trim()
    if (!email) return
    const name = email
      .split('@')[0]
      .split('.')
      .map((p) => (p ? p[0].toUpperCase() + (p.length > 1 ? p.slice(1) : '') : ''))
      .join(' ')
      .replace(/(\b\w) /g, '$1. ')
    addUser({ name: name || email, email, role: inviteRole, team: '—', status: 'Invited', lastActive: '—', reviews: 0 })
    setInviteEmail('')
    setInviteOpen(false)
  }

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          title="User Management"
          subtitle="Reviewers, leads, and admins — roles, access, and SSO provisioning."
          right={
            <button onClick={() => setInviteOpen((o) => !o)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-colors">
              <UserPlus size={16} /> Invite user
            </button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <Stat label="Total users" value={`${users.length}`} />
          <Stat label="Active" value={`${counts.active}`} />
          <Stat label="Pending invites" value={`${counts.invited}`} />
          <Stat label="Admins & managers" value={`${counts.admins}`} />
        </div>

        {inviteOpen && (
          <Card className="p-4 mb-4 animate-fadeup">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs font-semibold text-slate-500">Work email</label>
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@carrier.com" className="mt-1 w-full rounded-xl border border-brand-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)} className="mt-1 block rounded-xl border border-brand-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={sendInvite} className="flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                <KeyRound size={15} /> Send SSO invite
              </button>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-white rounded-xl border border-brand-100 p-1 shadow-card">
            {(['All', ...ROLES] as ('All' | Role)[]).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${roleFilter === r ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-brand-700'}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-100 bg-white text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_0.6fr_0.8fr] gap-3 px-5 py-3 border-b border-brand-50 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <span>User</span>
            <span>Role</span>
            <span>Team</span>
            <span>Reviews</span>
            <span className="text-right">Status</span>
          </div>
          <div className="divide-y divide-brand-50">
            {filtered.map((u) => (
              <div key={u.id} className="grid grid-cols-[1.5fr_1fr_1fr_0.6fr_0.8fr] gap-3 px-5 py-3 items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 grid place-items-center text-white font-bold text-xs shrink-0">
                    {u.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-brand-950 truncate flex items-center gap-1.5">
                      {u.name}
                      {u.id === currentUser?.id && <span className="text-[10px] font-bold text-brand-600 bg-brand-50 rounded px-1.5 py-0.5">You</span>}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{u.email}</div>
                  </div>
                </div>
                <div>
                  <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value as Role })} className={`text-[11px] font-semibold rounded-full border px-2.5 py-1 focus:outline-none cursor-pointer ${ROLE_STYLE[u.role]}`}>
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="bg-white text-slate-800">{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select value={u.team} onChange={(e) => updateUser(u.id, { team: e.target.value as Team | '—' })} className="text-xs text-slate-600 bg-slate-50 rounded-md px-2 py-1 focus:outline-none cursor-pointer max-w-full">
                    <option value="—">—</option>
                    {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="text-sm text-slate-600 tabular-nums">{u.reviews || '—'}</div>
                <div className="flex items-center justify-end gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Circle size={8} className={`fill-current ${STATUS_DOT[u.status]}`} />
                    {u.status}
                  </span>
                  {u.status !== 'Invited' && (
                    <button onClick={() => updateUser(u.id, { status: u.status === 'Disabled' ? 'Active' : 'Disabled' })} className="text-[11px] font-semibold text-slate-400 hover:text-brand-700 border border-brand-100 rounded-md px-2 py-1">
                      {u.status === 'Disabled' ? 'Enable' : 'Disable'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-400">No users match your filters.</div>}
          </div>
        </Card>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} />
          Roles map to permissions: Reviewers validate claims, Managers see results and coaching, System Managers manage users, forms, rules, and sampling. Active reviewers form the assignable pool used by Sampling.
        </div>
      </div>
    </div>
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
