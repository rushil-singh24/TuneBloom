import React from 'react'
import { motion } from 'framer-motion'
import { Music2, Zap, Smile, Music2 as MusicIcon, TrendingUp } from 'lucide-react'

export default function MusicAnalytics({ likedTracks }){
  if(!likedTracks || likedTracks.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Music2 className="w-16 h-16 text-white/20 mb-4" />
      <p className="text-white/50">Like some tracks to see your taste analytics!</p>
    </div>
  )

  const avgEnergy = likedTracks.reduce((s,t)=>s+(t.energy||0),0)/likedTracks.length
  const avgDanceability = likedTracks.reduce((s,t)=>s+(t.danceability||0),0)/likedTracks.length
  const avgValence = likedTracks.reduce((s,t)=>s+(t.valence||0),0)/likedTracks.length
  const avgTempo = likedTracks.reduce((s,t)=>s+(t.tempo||120),0)/likedTracks.length

  const stats = [
    { icon: Zap, label: 'Energy', value: `${Math.round(avgEnergy*100)}%`, description: avgEnergy>0.7?'High energy!':'Balanced' },
    { icon: MusicIcon, label: 'Danceability', value: `${Math.round(avgDanceability*100)}%`, description: avgDanceability>0.7?'Dance floor ready':'Groove worthy'},
    { icon: Smile, label: 'Mood', value: `${Math.round(avgValence*100)}%`, description: avgValence>0.7?'Super positive':'Balanced mood'},
    { icon: TrendingUp, label: 'Avg BPM', value: Math.round(avgTempo), description: avgTempo>130?'Fast paced':'Moderate' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat,index)=> (
          <motion.div key={stat.label} className="bg-white/5 rounded-2xl p-4" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:index*0.1}}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3"><stat.icon className="w-5 h-5 text-white"/></div>
            <p className="text-white/50 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center py-4">
        <p className="text-white/40 text-sm">Based on <span className="text-green-400 font-semibold">{likedTracks.length}</span> liked tracks</p>
      </div>
    </div>
  )
}
