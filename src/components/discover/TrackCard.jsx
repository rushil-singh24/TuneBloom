import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { ArrowRight, ArrowLeft, Heart, X as XIcon } from 'lucide-react'

export default function TrackCard({ track, onSwipe, isTopCard, queuedSwipe, onQueuedSwipeConsumed }) {
  const x = useMotionValue(0)
  const controls = useAnimation()
  const isAnimating = useRef(false)
  const [indicator, setIndicator] = useState(null) // 'liked' | 'disliked' | null
  const indicatorTimer = useRef(null)

  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const likeOpacity = useTransform(x, [0, 120], [0, 1])
  const likeScale = useTransform(x, [0, 120], [0.6, 1])
  const dislikeOpacity = useTransform(x, [-120, 0], [1, 0])
  const dislikeScale = useTransform(x, [-120, 0], [1, 0.6])

  if (!track) return null

  const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
  const albumArt = track.album?.images?.[0]?.url || '/placeholder-album.png'
  const releaseDate = track.album?.release_date || track.release_date || 'Unknown'

  const formatReleaseDate = (date) => {
    if (!date || date === 'Unknown') return 'Unknown'
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return date
    }
  }

  const performSwipe = (action) => {
    if (isAnimating.current) return
    isAnimating.current = true
    setIndicator(action)
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current)
    indicatorTimer.current = setTimeout(() => setIndicator(null), 800)

    const isLike = action === 'liked'
    const flyOutDistance = isLike ? 1000 : -1000

    controls.start({
      x: flyOutDistance,
      opacity: 0,
      transition: { duration: 0.5 }
    }).then(() => {
      onSwipe(track, action)
      controls.set({ x: 0, opacity: 1 })
      isAnimating.current = false
      if (onQueuedSwipeConsumed) onQueuedSwipeConsumed()
    })
  }

  const handleDragEnd = (event, info) => {
    const threshold = 100
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'liked' : 'disliked'
      performSwipe(direction)
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
    }
  }

  const similar = track.heardSamples?.[0]

  useEffect(() => {
    if (!isTopCard || !queuedSwipe) return
    if (queuedSwipe.trackId !== track.id) return
    performSwipe(queuedSwipe.action)
  }, [queuedSwipe, isTopCard, track?.id])

  useEffect(() => () => {
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current)
  }, [])

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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6">
          {/* Placeholder top spacing */}
          <div className="flex justify-end" />

          {/* Bottom: Track Info */}
          <div className="space-y-3">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 line-clamp-2">{track.name}</h2>
              <p className="text-lg text-white/90 line-clamp-1">{artists}</p>
              <p className="text-sm text-white/80 mt-1">{track.album?.name}</p>
              <p className="text-xs text-white/70 mt-1">Released: {formatReleaseDate(releaseDate)}</p>
            </div>

            {track.audioFeatures && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                  <p className="text-xs text-white/70">Energy</p>
                  <p className="text-sm font-semibold text-white">{Math.round(track.audioFeatures.energy * 100)}%</p>
                </div>
                <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                  <p className="text-xs text-white/70">Dance</p>
                  <p className="text-sm font-semibold text-white">{Math.round(track.audioFeatures.danceability * 100)}%</p>
                </div>
                <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
                  <p className="text-xs text-white/70">Mood</p>
                  <p className="text-sm font-semibold text-white">{Math.round(track.audioFeatures.valence * 100)}%</p>
                </div>
              </div>
            )}

            <div
              className="flex justify-center gap-6 mt-6"
              style={{ pointerEvents: isTopCard ? 'auto' : 'none' }}
            >
              <button
                onClick={() => performSwipe('disliked')}
                className="w-16 h-16 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                aria-label="Skip"
                title="Skip track"
              >
                <ArrowLeft className="w-8 h-8 text-white" strokeWidth={3} />
              </button>
              <button
                onClick={() => performSwipe('liked')}
                className="w-16 h-16 rounded-full bg-green-500/90 hover:bg-green-500 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                aria-label="Like"
                title="Like track"
              >
                <ArrowRight className="w-8 h-8 text-white" strokeWidth={2} />
              </button>
            </div>

            {similar && (
              <div className="mt-4 text-left px-3 py-2 bg-black/40 rounded-xl border border-white/10">
                <p className="text-xs text-slate-200/80 mb-1">Similar to your taste</p>
                <p className="text-sm font-semibold text-slate-50 truncate">{similar.name}</p>
                <p className="text-xs text-slate-200/70 truncate">{similar.artist}</p>
              </div>
            )}
          </div>
        </div>

        {/* Swipe Indicators */}
        <motion.div
          className="absolute top-8 left-8"
          style={{
            opacity: indicator === 'liked' ? 1 : likeOpacity,
            scale: indicator === 'liked' ? 1 : likeScale
          }}
        >
          <div className="px-4 py-3 bg-green-600/90 rounded-2xl rotate-12 border-4 border-white shadow-xl flex items-center justify-center">
            <Heart className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        <motion.div
          className="absolute top-8 right-8"
          style={{
            opacity: indicator === 'disliked' ? 1 : dislikeOpacity,
            scale: indicator === 'disliked' ? 1 : dislikeScale
          }}
        >
          <div className="px-4 py-3 bg-red-600/90 rounded-2xl -rotate-12 border-4 border-white shadow-xl flex items-center justify-center">
            <XIcon className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
