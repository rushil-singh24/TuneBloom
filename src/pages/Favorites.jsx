import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Heart, Play, Pause, Share2, Plus, ListPlus, Trash2, RefreshCw } from 'lucide-react'
import { spotifyApi } from '@/services/spotifyApi'
import { tempPlaylist } from '@/utils'

const addTracksInChunks = async (playlistId, uris) => {
  const uniqueUris = Array.from(new Set(uris))
  const chunkSize = 100
  for (let i = 0; i < uniqueUris.length; i += chunkSize) {
    const chunk = uniqueUris.slice(i, i + chunkSize)
    await spotifyApi.addTracksToPlaylist(playlistId, chunk)
  }
}

export default function Favorites() {
  const [tracks, setTracks] = useState(() => tempPlaylist.getTracks())
  const [playingTrackId, setPlayingTrackId] = useState(null)
  const [audioElement, setAudioElement] = useState(null)
  const [playlistName, setPlaylistName] = useState('TuneBloom Likes')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => spotifyApi.getCurrentUser()
  })

  const { data: playlists = [], isLoading: playlistsLoading } = useQuery({
    queryKey: ['userPlaylists'],
    queryFn: async () => {
      const response = await spotifyApi.getUserPlaylists(50)
      return response.items || []
    },
    enabled: !!currentUser
  })

  useEffect(() => {
    setTracks(tempPlaylist.getTracks())
  }, [])

  const trackUris = tracks.map(track => track.uri || `spotify:track:${track.id}`)

  const handlePlayPreview = (track) => {
    if (!track.preview_url) return

    if (playingTrackId === track.id) {
      audioElement?.pause()
      setPlayingTrackId(null)
      setAudioElement(null)
    } else {
      audioElement?.pause()
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

  const handleRemoveTrack = (trackId) => {
    if (playingTrackId === trackId) {
      audioElement?.pause()
      setPlayingTrackId(null)
      setAudioElement(null)
    }
    setTracks(tempPlaylist.removeTrack(trackId))
  }

  const handleRefreshTemp = () => {
    setTracks(tempPlaylist.getTracks())
  }

  const clearAll = () => {
    tempPlaylist.clear()
    setTracks([])
    audioElement?.pause()
    setPlayingTrackId(null)
  }

  const createPlaylistMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User data not loaded yet')
      if (!tracks.length) throw new Error('No tracks to add')

      const playlist = await spotifyApi.createPlaylist(
        currentUser.id,
        playlistName.trim() || 'TuneBloom Likes',
        'Tracks you liked while swiping in TuneBloom',
        true
      )

      await addTracksInChunks(playlist.id, trackUris)
      return playlist
    },
    onSuccess: (playlist) => {
      alert(`Playlist created on Spotify: "${playlist.name}"`)
    },
    onError: (error) => {
      console.error('Failed to create playlist:', error)
      alert(error.message || 'Failed to create playlist. Please try again.')
    }
  })

  const addToExistingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlaylistId) throw new Error('Select a playlist first')
      if (!tracks.length) throw new Error('No tracks to add')

      await addTracksInChunks(selectedPlaylistId, trackUris)
      return { playlistId: selectedPlaylistId }
    },
    onSuccess: () => {
      alert('Tracks added to playlist on Spotify')
    },
    onError: (error) => {
      console.error('Failed to add to playlist:', error)
      alert(error.message || 'Failed to add tracks. Please try again.')
    }
  })

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-white/30" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No temporary likes yet</h2>
          <p className="text-white/60">
            Swipe right on recommendations to start building your temporary playlist.
          </p>
          <button
            onClick={handleRefreshTemp}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white/80"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Temporary Likes</h1>
              <p className="text-white/60 text-sm mt-1">
                {tracks.length} tracks saved from swiping
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshTemp}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Actions */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-green-400" />
              <h3 className="text-white font-semibold">Create playlist from likes</h3>
            </div>
            <input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-white/40 mb-3"
              placeholder="Playlist name"
            />
            <button
              onClick={() => createPlaylistMutation.mutate()}
              disabled={createPlaylistMutation.isLoading || !tracks.length}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white font-semibold rounded-xl transition-colors"
            >
              {createPlaylistMutation.isLoading ? 'Creating...' : 'Create on Spotify'}
            </button>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <ListPlus className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-semibold">Add to existing playlist</h3>
            </div>
            <select
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              disabled={playlistsLoading || !playlists.length}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white mb-3 disabled:opacity-60"
            >
              <option value="">Select a playlist</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id} className="bg-slate-900">
                  {playlist.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => addToExistingMutation.mutate()}
              disabled={addToExistingMutation.isLoading || !selectedPlaylistId || !tracks.length}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors"
            >
              {addToExistingMutation.isLoading ? 'Adding...' : 'Add tracks'}
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-3">
          {tracks.map((track, index) => {
            const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown'
            const albumArt = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url
            const isPlaying = playingTrackId === track.id

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/5 hover:border-white/10"
              >
                <div className="flex items-center gap-4">
                  {/* Album Art */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={albumArt}
                      alt={track.name}
                      className="w-16 h-16 rounded-lg object-cover cursor-pointer"
                      onClick={() => handlePlayPreview(track)}
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
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="p-2 rounded-full hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Remove from temporary likes"
                    >
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
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
