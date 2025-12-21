import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { RotateCcw, Sparkles, Music2, Undo2 } from 'lucide-react'
import TrackCard from '@/components/discover/TrackCard'
import { recommendationEngine } from '@/services/recommendationEngine'
import { spotifyApi } from '@/services/spotifyApi'
import { getToken } from '@/config/spotify'
import { tempPlaylist } from '@/utils'

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipedTracks, setSwipedTracks] = useState([])
  const [likedTracks, setLikedTracks] = useState([])
  const [feedbackVersion, setFeedbackVersion] = useState(0)
  const [vibeShift, setVibeShift] = useState(0)
  const [undoStack, setUndoStack] = useState([]) // stack of { track, action }
  const [queuedSwipe, setQueuedSwipe] = useState(null) // { trackId, action, token }
  const token = getToken()

  // Ensure token is set in spotifyApi before fetching
  useEffect(() => {
    if (token && spotifyApi) {
      spotifyApi.setToken(token)
      console.log('✅ Token set in spotifyApi from Home component')
    }
  }, [token])

  // Fetch recommendations - only if token exists
  const { data: recommendations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations', token, feedbackVersion, vibeShift],
    queryFn: async () => {
      // Double-check token is set
      if (!spotifyApi.token) {
        const currentToken = getToken()
        if (currentToken) {
          spotifyApi.setToken(currentToken)
        } else {
          throw new Error('No access token available')
        }
      }
      const recs = await recommendationEngine.generateRecommendations(50, {
        likedTracks,
        vibeShift
      })
      return recs
    },
    enabled: !!token, // Only run query if token exists
    staleTime: Infinity, // Don't refetch automatically
    retry: 1
  })

  // Handle swipe action
  const handleSwipe = async (track, action) => {
    if (!track) return
    const swipedTrack = {
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      uri: track.uri,
      action,
      energy: track.audioFeatures?.energy,
      danceability: track.audioFeatures?.danceability,
      valence: track.audioFeatures?.valence,
      tempo: track.audioFeatures?.tempo,
      genre: track.artists?.[0]?.name || 'Unknown',
      created_date: new Date().toISOString()
    }

    setSwipedTracks(prev => [...prev, swipedTrack])
    setUndoStack(prev => [...prev, { track, action }])
    
    if (action === 'liked') {
      setLikedTracks(prev => [...prev, swipedTrack])
      
      // Add to temporary playlist instead of directly saving to library
      tempPlaylist.addTrack(track)
    }

    // Exclude from future recommendations
    recommendationEngine.excludeTrack(track.id)

    // Move to next card
    setCurrentIndex(prev => prev + 1)
  }

  const handleRefresh = () => {
    setCurrentIndex(0)
    setFeedbackVersion(v => v + 1)
    setVibeShift(v => v + 1)
    setUndoStack([])
    refetch()
  }

  const handleUndo = () => {
    if (currentIndex === 0 || undoStack.length === 0) return
    const last = undoStack[undoStack.length - 1]
    if (!last) return
    const { track, action } = last

    setCurrentIndex(prev => Math.max(0, prev - 1))
    setSwipedTracks(prev => prev.slice(0, -1))
    setUndoStack(prev => prev.slice(0, -1))

    if (action === 'liked') {
      setLikedTracks(prev => prev.filter(t => t.id !== track.id))
      tempPlaylist.removeTrack(track.id)
    }

    recommendationEngine.removeExclusion(track.id)
  }

  useEffect(() => {
    const handleKey = (e) => {
      const topTrack = recommendations[currentIndex]
      if (!topTrack) return
      if (e.key === 'ArrowRight') {
        setQueuedSwipe({ trackId: topTrack.id, action: 'liked', token: Date.now() })
      } else if (e.key === 'ArrowLeft') {
        setQueuedSwipe({ trackId: topTrack.id, action: 'disliked', token: Date.now() })
      } else if (e.key === 'ArrowUp') {
        handleUndo()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [recommendations, currentIndex])

  const remainingTracks = recommendations.length - currentIndex

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4" />
        <p className="text-white/60 text-lg">Analyzing your music taste...</p>
        <p className="text-white/40 text-sm mt-2">This may take a moment</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Music2 className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-white/60 mb-6">
            We couldn't load your recommendations. Make sure you have some listening history on Spotify.
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (remainingTracks === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">All done!</h2>
          <p className="text-white/60 mb-2">
            You've swiped through all recommendations
          </p>
          <p className="text-white/80 text-lg font-semibold mb-6">
            {likedTracks.length} tracks liked
          </p>
          <button
            onClick={handleRefresh}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-full transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" />
            Get More Recommendations
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Discover</h1>
            </div>
            <p className="text-white/60 text-sm">
              {remainingTracks} tracks remaining
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Refresh recommendations and vibe"
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleUndo}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Undo last swipe"
              disabled={currentIndex === 0 || undoStack.length === 0}
            >
              <Undo2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Swipe Deck */}
      <div className="flex-1 relative px-4 pb-24">
        <div className="max-w-lg mx-auto h-full relative">
          <AnimatePresence>
            {recommendations.slice(currentIndex, currentIndex + 3).map((track, index) => (
              <div
                key={track.id}
                className="absolute inset-0"
                style={{ 
                  zIndex: 3 - index,
                  pointerEvents: index === 0 ? 'auto' : 'none'
                }}
              >
                <TrackCard
                  track={track}
                  onSwipe={handleSwipe}
                  isTopCard={index === 0}
                  queuedSwipe={queuedSwipe}
                  onQueuedSwipeConsumed={() => setQueuedSwipe(null)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Instructions (show on first card) */}
      {currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-28 left-0 right-0 text-center px-4"
        >
          <div className="max-w-lg mx-auto bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/10">
            <p className="text-white/80 text-sm">
              Swipe right to <span className="text-green-400 font-semibold">like</span>, left to <span className="text-red-400 font-semibold">skip</span>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
