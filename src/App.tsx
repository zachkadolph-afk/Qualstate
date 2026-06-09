import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from './lib/store'
import { canConfigure } from './data/users'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Queue from './pages/Queue'
import Review from './pages/Review'
import HowItWorks from './pages/HowItWorks'
import Scorecards from './pages/Scorecards'
import Calibration from './pages/Calibration'
import QuestionnaireBuilder from './pages/QuestionnaireBuilder'
import Rules from './pages/Rules'
import UserManagement from './pages/UserManagement'
import Sampling from './pages/Sampling'
import Sidebar from './components/Sidebar'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const location = useLocation()
  const { currentUser } = useStore()
  const admin = canConfigure(currentUser)

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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/review/:id" element={<Review />} />
          <Route path="/scorecards" element={<Scorecards />} />
          <Route path="/calibration" element={<Calibration />} />
          <Route path="/questionnaire" element={admin ? <QuestionnaireBuilder /> : <Navigate to="/dashboard" replace />} />
          <Route path="/rules" element={admin ? <Rules /> : <Navigate to="/dashboard" replace />} />
          <Route path="/users" element={admin ? <UserManagement /> : <Navigate to="/dashboard" replace />} />
          <Route path="/sampling" element={admin ? <Sampling /> : <Navigate to="/dashboard" replace />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
