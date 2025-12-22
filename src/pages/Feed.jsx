import React from 'react'
import { Rss } from 'lucide-react'

export default function Feed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white px-6 pb-24">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Rss className="w-8 h-8 text-amber-300" />
        </div>
        <h1 className="text-3xl font-bold">Feed</h1>
        <p className="text-white/60">Coming soon...</p>
      </div>
    </div>
  )
}
