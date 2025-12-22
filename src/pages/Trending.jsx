import React from 'react'
import { Flame } from 'lucide-react'

export default function Trending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white px-6 pb-24">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Flame className="w-8 h-8 text-orange-400" />
        </div>
        <h1 className="text-3xl font-bold">Trending</h1>
        <p className="text-white/60">Coming soon...</p>
      </div>
    </div>
  )
}
