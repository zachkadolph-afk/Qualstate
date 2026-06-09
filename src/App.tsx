import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from './lib/store'
import { canConfigure, Role } from './data/users'
import Login from './pages/Login'
import Queue from './pages/Queue'
import Review from './pages/Review'
import HowItWorks from './pages/HowItWorks'
import Results from './pages/Results'
import Coaching from './pages/Coaching'
import Audit from './pages/Audit'
import QuestionnaireBuilder from './pages/QuestionnaireBuilder'
import Rules from './pages/Rules'
import UserManagement from './pages/UserManagement'
import Sampling from './pages/Sampling'
import SystemManagement from './pages/SystemManagement'
import Sidebar from './components/Sidebar'

/** where each role lands after sign-in */
function landingFor(role?: Role): string {
  if (role === 'System Manager') return '/system'
  if (role === 'Manager') return '/results'
  return '/queue' // Reviewer -> review workbench
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const location = useLocation()
  const { currentUser } = useStore()
  const admin = canConfigure(currentUser)
  const home = landingFor(currentUser?.role)

  if (!authed) {
    return (
      <Routes>
        <Route path="*" element={<Login onLogin={() => setAuthed(true)} />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main key={location.pathname} className="flex-1 min-w-0 animate-fadeup">
        <Routes>
          <Route path="/" element={<Navigate to={home} replace />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/review/:id" element={<Review />} />
          <Route path="/results" element={<Results />} />
          <Route path="/scorecards" element={<Results />} />
          <Route path="/calibration" element={<Results />} />
          <Route path="/coaching" element={admin ? <Coaching /> : <Navigate to={home} replace />} />
          <Route path="/system" element={admin ? <SystemManagement /> : <Navigate to={home} replace />} />
          <Route path="/audit" element={admin ? <Audit /> : <Navigate to={home} replace />} />
          <Route path="/questionnaire" element={admin ? <QuestionnaireBuilder /> : <Navigate to={home} replace />} />
          <Route path="/rules" element={admin ? <Rules /> : <Navigate to={home} replace />} />
          <Route path="/users" element={admin ? <UserManagement /> : <Navigate to={home} replace />} />
          <Route path="/sampling" element={admin ? <Sampling /> : <Navigate to={home} replace />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </main>
    </div>
  )
}
