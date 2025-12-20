import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Heart, Play, Pause, Music2, Share2, Plus } from 'lucide-react'
import { spotifyApi } from '@/services/spotifyApi'

export default function Favorites() {
  const [playingTrackId, setPlayingTrackId] = useState(null)
  const [audioElement, setAudioElement] = useState(null)

  // In a real app, you'd fetch this from your backend or local storage
  // For now, we'll get the user's saved tracks from Spotify
  const { data: savedTracks = [], isLoading } = useQuery({
    queryKey: ['savedTracks'],
    queryFn: async () => {
      const response = await spotifyApi.getSavedTracks(50)
      return response.items.map(item => item.track)
    }
  })

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async () => {
      const user = await spotifyApi.getCurrentUser()
      const playlist = await spotifyApi.createPlaylist(
        user.id,
        'TuneBloom Favorites',
        'My favorite tracks discovered on TuneBloom',
        true
      )
      
      // Add tracks to playlist (Spotify allows max 100 at a time)
      const trackUris = savedTracks.slice(0, 100).map(track => track.uri)
      await spotifyApi.addTracksToPlaylist(playlist.id, trackUris)
      
      return playlist
    },
    onSuccess: (playlist) => {
      alert(`Playlist created! Check your Spotify for "${playlist.name}"`)
    },
    onError: (error) => {
      console.error('Failed to create playlist:', error)
      alert('Failed to create playlist. Please try again.')
    }
  })

  const handlePlayPreview = (track) => {
    if (!track.preview_url) return

    if (playingTrackId === track.id) {
      // Stop current track
      audioElement?.pause()
      setPlayingTrackId(null)
      setAudioElement(null)
    } else {
      // Stop previous track
      audioElement?.pause()
      
      // Play new track
      const audio = new Audio(track.preview_url)
      audio.play()
      audio.onended = () => {
        setPlayingTrackId(null)
        setAudioElement(null)
      }
      
      setPlayingTrackId(track.id)
      setAudioElement(audio)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    )
  }

  if (savedTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-white/30" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No favorites yet</h2>
          <p className="text-white/60">
            Start swiping to discover and save your favorite tracks!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Your Favorites</h1>
              <p className="text-white/60 text-sm mt-1">
                {savedTracks.length} tracks saved
              </p>
            </div>
            <button
              onClick={() => createPlaylistMutation.mutate()}
              disabled={createPlaylistMutation.isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-semibold rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
              {createPlaylistMutation.isLoading ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {savedTracks.map((track, index) => {
            const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown'
            const albumArt = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url
            const isPlaying = playingTrackId === track.id

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/5 hover:border-white/10"
              >
                <div className="flex items-center gap-4">
                  {/* Album Art */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={albumArt}
                      alt={track.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    {track.preview_url && (
                      <button
                        onClick={() => handlePlayPreview(track)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 text-white" fill="white" />
                        ) : (
                          <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {track.name}
                    </h3>
                    <p className="text-white/60 text-sm truncate">
                      {artists}
                    </p>
                    <p className="text-white/40 text-xs truncate mt-0.5">
                      {track.album?.name}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Heart
                      className="w-5 h-5 text-green-500"
                      fill="currentColor"
                    />
                    {track.external_urls?.spotify && (
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Share2 className="w-4 h-4 text-white/60" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}