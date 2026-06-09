import { useState } from 'react'
import { ArrowRight, ShieldCheck, Sparkles, BarChart3 } from 'lucide-react'
import Logo from '../components/Logo'

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('a.reyes@qualstate.ai')
  const [pw, setPw] = useState('demo')

  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel */}
      <div className="hidden lg:flex w-[46%] bg-brand-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div
          className="absolute -top-32 -right-24 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,122,24,0.35), transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 -left-20 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(47,109,246,0.5), transparent 70%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo light size={38} />
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
              The quality program
              <br />
              <span className="text-accent-400">of the future.</span>
            </h1>
            <p className="mt-4 text-brand-100/70 text-[15px] max-w-md leading-relaxed">
              AI reviews every personal-lines claim first. Your reviewers validate, calibrate, and
              teach the model — turning quality assurance into a continuously improving system.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: Sparkles, t: 'AI first-pass on all property, auto & casualty claims' },
                { icon: ShieldCheck, t: 'Human-in-the-loop validation with R1 / R2 calibration' },
                { icon: BarChart3, t: 'Per-question reliability scoring feeds back to the model' },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="flex items-center gap-3 text-sm text-brand-50/90">
                    <div className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center">
                      <Icon size={16} className="text-accent-400" />
                    </div>
                    {f.t}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="text-xs text-brand-100/50">
            Trusted calibration for personal lines claims · SOC 2 · Enterprise SSO
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex-1 grid place-items-center bg-white px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onLogin()
          }}
          className="w-full max-w-sm animate-fadeup"
        >
          <div className="lg:hidden mb-8">
            <Logo size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-950 tracking-tight">Reviewer sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Welcome back. Let's calibrate some claims.</p>

          <label className="block mt-7 text-sm font-semibold text-brand-950">Work email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />

          <label className="block mt-4 text-sm font-semibold text-brand-950">Password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />

          <button
            type="submit"
            className="mt-6 w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors shadow-glow"
          >
            Enter dashboard <ArrowRight size={18} />
          </button>
          <p className="text-center text-xs text-slate-400 mt-4">
            Demo environment — any credentials continue.
          </p>
        </form>
      </div>
    </div>
  )
}
