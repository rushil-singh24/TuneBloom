import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Analytics from './pages/Analytics'

export default function App(){
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
      <nav className="mb-6">
        <Link to="/analytics" className="underline">Analytics</Link>
      </nav>
      <Routes>
        <Route path="/analytics" element={<Analytics/>} />
        <Route path="/" element={<div>Home — open <Link to="/analytics">Analytics</Link></div>} />
      </Routes>
    </div>
  )
}
