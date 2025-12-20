import React, { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { Heart, X, Play, Pause } from 'lucide-react'

export default function TrackCard({ track, onSwipe, isTopCard }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const x = useMotionValue(0)
  const controls = useAnimation()
  
  // Transform x position to rotation
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const handleDragEnd = (event, info) => {
    const threshold = 100
    
    if (Math.abs(info.offset.x) > threshold) {
      // Swipe detected
      const direction = info.offset.x > 0 ? 'right' : 'left'
      const flyOutDistance = direction === 'right' ? 1000 : -1000
      
      controls.start({
        x: flyOutDistance,
        transition: { duration: 0.3 }
      }).then(() => {
        onSwipe(track, direction === 'right' ? 'liked' : 'disliked')
      })
    } else {
      // Return to center
      controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      })
    }
  }

  const handleButtonSwipe = (action) => {
    const flyOutDistance = action === 'liked' ? 1000 : -1000
    
    controls.start({
      x: flyOutDistance,
      opacity: 0,
      transition: { duration: 0.3 }
    }).then(() => {
      onSwipe(track, action)
    })
  }

  const toggleAudio = () => {
    if (!track.preview_url) return
    
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  if (!track) return null

  const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
  const albumArt = track.album?.images?.[0]?.url || '/placeholder-album.png'

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{ x, rotate, opacity }}
      drag={isTopCard ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: isTopCard ? 1 : 0.95 }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="relative w-full h-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-sm">
        {/* Album Art Background */}
        <div className="absolute inset-0">
          <img 
            src={albumArt}
            alt={track.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6">
          {/* Top: Play button */}
          {track.preview_url && (
            <div className="flex justify-end">
              <button
                onClick={toggleAudio}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" fill="white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                )}
              </button>
              <audio
                ref={audioRef}
                src={track.preview_url}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          )}

          {/* Bottom: Track Info */}
          <div className="space-y-3">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 line-clamp-2">
                {track.name}
              </h2>
              <p className="text-lg text-white/80 line-clamp-1">
                {artists}
              </p>
              <p className="text-sm text-white/60 mt-1">
                {track.album?.name}
              </p>
            </div>

            {/* Audio Features Preview */}
            {track.audioFeatures && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-xs text-white/60">Energy</p>
                  <p className="text-sm font-semibold text-white">
                    {Math.round(track.audioFeatures.energy * 100)}%
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-xs text-white/60">Dance</p>
                  <p className="text-sm font-semibold text-white">
                    {Math.round(track.audioFeatures.danceability * 100)}%
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-xs text-white/60">Mood</p>
                  <p className="text-sm font-semibold text-white">
                    {Math.round(track.audioFeatures.valence * 100)}%
                  </p>
                </div>
              </div>
            )}

            {/* Swipe Actions (visible on mobile) */}
            {isTopCard && (
              <div className="flex justify-center gap-6 mt-6">
                <button
                  onClick={() => handleButtonSwipe('disliked')}
                  className="w-16 h-16 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                >
                  <X className="w-8 h-8 text-white" strokeWidth={3} />
                </button>
                <button
                  onClick={() => handleButtonSwipe('liked')}
                  className="w-16 h-16 rounded-full bg-green-500/90 hover:bg-green-500 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                >
                  <Heart className="w-8 h-8 text-white" fill="white" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Swipe Indicators */}
        <motion.div
          className="absolute top-8 left-8"
          style={{ 
            opacity: useTransform(x, [0, 100], [0, 1]),
            scale: useTransform(x, [0, 100], [0.5, 1])
          }}
        >
          <div className="px-6 py-3 bg-green-500 rounded-2xl rotate-12 border-4 border-white shadow-xl">
            <span className="text-2xl font-black text-white">LIKE</span>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-8 right-8"
          style={{ 
            opacity: useTransform(x, [-100, 0], [1, 0]),
            scale: useTransform(x, [-100, 0], [1, 0.5])
          }}
        >
          <div className="px-6 py-3 bg-red-500 rounded-2xl -rotate-12 border-4 border-white shadow-xl">
            <span className="text-2xl font-black text-white">SKIP</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}