import React from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { Heart, X, ArrowRight, ArrowLeft } from 'lucide-react'

export default function TrackCard({ track, onSwipe, isTopCard }) {
  const x = useMotionValue(0)
  const controls = useAnimation()
  
  // Transform x position to rotation
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const likePulse = useTransform(x, [80, 200], [0, 1])
  const skipPulse = useTransform(x, [-200, -80], [1, 0])

  const performSwipe = (action) => {
    const isLike = action === 'liked'
    const flyOutDistance = isLike ? 1200 : -1200
    const pulseKick = isLike ? 180 : -180
    x.set(pulseKick)

    controls.start({
      x: flyOutDistance,
      opacity: 0,
      transition: { duration: 0.35, ease: 'easeIn' }
    }).then(() => {
      onSwipe(track, action)
    })
  }

  const handleDragEnd = (event, info) => {
    const threshold = 100
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'liked' : 'disliked'
      performSwipe(direction)
    } else {
      controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 }
      })
    }
  }

  const handleButtonSwipe = (action) => {
    performSwipe(action)
  }

  const handleImageClick = (e) => {
    e.stopPropagation()
  }

  if (!track) return null

  const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
  const albumArt = track.album?.images?.[0]?.url || '/placeholder-album.png'
  const releaseDate = track.album?.release_date || track.release_date || 'Unknown'
  
  // Format release date
  const formatReleaseDate = (date) => {
    if (!date || date === 'Unknown') return 'Unknown'
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return date
    }
  }

  return (
    <motion.div
      className="absolute w-full h-full px-4"
      style={{ x, rotate, opacity }}
      drag={isTopCard ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ scale: isTopCard ? 1 : 0.95 }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="relative w-full h-full bg-[#0f0f0f] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        <div className="flex flex-col h-full p-5 pb-10 gap-5">
          {/* Album Art */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] md:max-w-[360px]">
              <img
                src={albumArt}
                alt={track.name}
                className={`w-full aspect-square max-h-[340px] object-cover rounded-2xl shadow-xl ${track.preview_url ? 'cursor-pointer' : ''}`}
                onClick={handleImageClick}
              />
            </div>
          </div>

          {/* Track Info */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white line-clamp-2">
              {track.name}
            </h2>
            <p className="text-white/80 text-base line-clamp-1">
              {artists}
            </p>
            <p className="text-white/60 text-sm line-clamp-1">
              {track.album?.name}
            </p>
            <p className="text-white/50 text-xs">
              Released • {formatReleaseDate(releaseDate)}
            </p>
            {track.heardSamples?.length > 0 && (
              <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-white/70 text-xs uppercase tracking-wide mb-2">Similar to your taste</p>
                <div className="space-y-1">
                  {track.heardSamples.slice(0, 3).map(sample => (
                    <div key={sample.id} className="flex flex-col">
                      <span className="text-sm text-white truncate">{sample.name}</span>
                      <span className="text-xs text-white/60 truncate">{sample.artist}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {isTopCard && (
            <div className="mt-3 mb-2 flex items-center justify-center gap-5">
              <button
                onClick={() => handleButtonSwipe('disliked')}
                className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all hover:scale-105 active:scale-95"
                aria-label="Skip"
                title="Skip track"
              >
                <ArrowLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
              </button>

              <button
                onClick={() => handleButtonSwipe('liked')}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
                aria-label="Like"
                title="Like track"
              >
                <ArrowRight className="w-7 h-7 text-white" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        {/* Swipe Indicators */}
        <motion.div
          className="absolute top-8 left-4"
          style={{ 
            opacity: useTransform(x, [0, 100], [0, 1]),
            scale: useTransform(x, [0, 100], [0.5, 1])
          }}
        >
          <motion.div
            className="px-6 py-3 bg-red-500 rounded-2xl rotate-12 border-4 border-white shadow-xl flex items-center gap-2"
            animate={{ scale: 1 }}
          >
            <Heart className="w-6 h-6 text-white" fill="white" />
            <span className="text-2xl font-black text-white">LIKE</span>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute top-8 right-4"
          style={{ 
            opacity: useTransform(x, [-100, 0], [1, 0]),
            scale: useTransform(x, [-100, 0], [1, 0.5])
          }}
        >
          <motion.div
            className="px-6 py-3 bg-red-500 rounded-2xl -rotate-12 border-4 border-white shadow-xl flex items-center gap-2"
            animate={{ scale: 1 }}
          >
            <X className="w-6 h-6 text-white" />
            <span className="text-2xl font-black text-white">SKIP</span>
          </motion.div>
        </motion.div>

        {/* Pulse overlay for drag feedback */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: likePulse }}
        >
          <div className="flex items-center gap-2 px-5 py-3 bg-green-500/20 border border-green-400/50 rounded-full backdrop-blur-md">
            <Heart className="w-6 h-6 text-green-200" fill="currentColor" />
            <span className="text-green-100 font-semibold">Keep it</span>
          </div>
        </motion.div>
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: skipPulse }}
        >
          <div className="flex items-center gap-2 px-5 py-3 bg-red-500/20 border border-red-400/50 rounded-full backdrop-blur-md">
            <X className="w-6 h-6 text-red-200" />
            <span className="text-red-100 font-semibold">Skip</span>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
