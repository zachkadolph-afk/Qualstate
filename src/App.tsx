import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Queue from './pages/Queue'
import Review from './pages/Review'
import HowItWorks from './pages/HowItWorks'
import Sidebar from './components/Sidebar'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const location = useLocation()

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
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
