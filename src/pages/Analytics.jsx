import React from 'react'
import { motion } from 'framer-motion'
import { localApi } from '@/lib/localApi'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, TrendingUp } from 'lucide-react'

const base44 = localApi
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import MusicAnalytics from '@/components/analytics/MusicAnalytics'

export default function AnalyticsPage(){
  const { data: likedTracks = [], isLoading } = useQuery({
    queryKey: ['likedTracks'],
    queryFn: async () => {
      const tracks = await base44.entities.SwipedTrack.filter({ action: 'liked' }, '-created_date')
      return tracks
    }
  })

  const { data: allTracks = [] } = useQuery({
    queryKey: ['allSwipedTracks'],
    queryFn: () => base44.entities.SwipedTrack.list()
  })

  const totalSwipes = allTracks.length
  const likeRate = totalSwipes > 0 ? Math.round((likedTracks.length / totalSwipes) * 100) : 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-4">
        <Link to={createPageUrl('Home')} className="p-2 rounded-xl bg-white/5"> 
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Your Taste</h1>
          <p className="text-white/40 text-sm">Music analytics & insights</p>
        </div>
      </div>

      <motion.div className="grid grid-cols-3 gap-4 mb-6" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
        <div className="bg-gradient-to-br from-white/3 to-white/6 rounded-2xl p-4 text-center border border-white/5 shadow-sm">
          <p className="text-4xl font-extrabold text-white">{totalSwipes}</p>
          <p className="text-white/60 text-xs mt-1">Total Swipes</p>
        </div>
        <div className="bg-gradient-to-br from-green-700/10 to-green-500/10 rounded-2xl p-4 text-center border border-white/5 shadow-sm">
          <p className="text-4xl font-extrabold text-green-400">{likedTracks.length}</p>
          <p className="text-white/60 text-xs mt-1">Liked</p>
        </div>
        <div className="bg-gradient-to-br from-white/3 to-white/6 rounded-2xl p-4 text-center border border-white/5 shadow-sm">
          <p className="text-4xl font-extrabold text-white">{likeRate}%</p>
          <p className="text-white/60 text-xs mt-1">Like Rate</p>
        </div>
      </motion.div>

      {isLoading ? <div>Loading...</div> : <MusicAnalytics likedTracks={likedTracks} />}

      {likedTracks.length >= 5 && (
        <motion.div className="mt-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Your Music DNA</h3>
              <p className="text-white/60 text-sm">Based on your likes, you tend to prefer ...</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
