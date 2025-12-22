import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Heart, Play, Pause, Share2, Plus, ListPlus, Trash2, RefreshCw } from 'lucide-react'
import { spotifyApi } from '@/services/spotifyApi'
import { tempPlaylist, tempDislikes } from '@/utils'

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
  const [dislikedTracks, setDislikedTracks] = useState(() => tempDislikes.getTracks())
  const [playingTrackId, setPlayingTrackId] = useState(null)
  const [audioElement, setAudioElement] = useState(null)
  const [playlistName, setPlaylistName] = useState('TuneBloom Likes')
  const [userEditedName, setUserEditedName] = useState(false)
  const [selectedTrackIds, setSelectedTrackIds] = useState(() => tempPlaylist.getTracks().map(t => t.id))
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('')
  const [showDislikes, setShowDislikes] = useState(false)

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
    setSelectedTrackIds(tempPlaylist.getTracks().map(t => t.id))
    setDislikedTracks(tempDislikes.getTracks())
  }, [])

  const selectedTracks = useMemo(
    () => tracks.filter(t => selectedTrackIds.includes(t.id)),
    [tracks, selectedTrackIds]
  )
  const trackUris = selectedTracks.map(track => track.uri || `spotify:track:${track.id}`)

  const computeNextTuneBloomName = (lists = []) => {
    const base = 'TuneBloom Likes'
    const suffixes = lists
      .map(p => p.name)
      .filter(name => name && name.startsWith(base))
      .map(name => {
        const match = name.match(/^TuneBloom Likes(?:\\s*(\\d+))?$/)
        return match && match[1] ? parseInt(match[1], 10) : 1
      })
    const nextNum = suffixes.length ? Math.max(...suffixes) + 1 : 1
    return nextNum === 1 ? base : `${base} ${nextNum}`
  }

  useEffect(() => {
    if (!playlists || !playlists.length) return
    if (userEditedName) return
    const nextName = computeNextTuneBloomName(playlists)
    setPlaylistName(nextName)
  }, [playlists, userEditedName])

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

  const handleRemoveDislike = (trackId) => {
    setDislikedTracks(tempDislikes.removeTrack(trackId))
  }

  const handleMoveDislikeToLikes = (track) => {
    tempPlaylist.addTrack(track)
    tempDislikes.removeTrack(track.id)
    setTracks(tempPlaylist.getTracks())
    setDislikedTracks(tempDislikes.getTracks())
    setSelectedTrackIds(prev => prev.includes(track.id) ? prev : [...prev, track.id])
  }

  const handleRefreshTemp = () => {
    setTracks(tempPlaylist.getTracks())
    setDislikedTracks(tempDislikes.getTracks())
  }

  const clearAll = () => {
    tempPlaylist.clear()
    tempDislikes.clear()
    setTracks([])
    setDislikedTracks([])
    audioElement?.pause()
    setPlayingTrackId(null)
  }

  const createPlaylistMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User data not loaded yet')
      if (!selectedTracks.length) throw new Error('Select at least one track')

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
      // Suggest next name for subsequent creations
      const nextName = computeNextTuneBloomName([...(playlists || []), playlist])
      setUserEditedName(false)
      setPlaylistName(nextName)
    },
    onError: (error) => {
      console.error('Failed to create playlist:', error)
      alert(error.message || 'Failed to create playlist. Please try again.')
    }
  })

  const addToExistingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlaylistId) throw new Error('Select a playlist first')
      if (!selectedTracks.length) throw new Error('Select at least one track')

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
              onChange={(e) => {
                setPlaylistName(e.target.value)
                setUserEditedName(true)
              }}
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
              {playlists
                .filter(playlist => playlist.name?.startsWith('TuneBloom Likes'))
                .map((playlist) => (
                  <option key={playlist.id} value={playlist.id} className="bg-slate-900">
                    {playlist.name}
                  </option>
                ))}
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

      {/* Disliked Tracks */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">Disliked tracks</span>
              <span className="text-white/60 text-sm">({dislikedTracks.length})</span>
            </div>
            <button
              onClick={() => setShowDislikes(v => !v)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm transition-colors"
            >
              {showDislikes ? 'Hide' : 'Show'}
            </button>
          </div>

          {showDislikes && (
            <div className="mt-4 space-y-3">
              {dislikedTracks.length === 0 ? (
                <p className="text-white/50 text-sm">No disliked tracks yet.</p>
              ) : (
                dislikedTracks.map((track, index) => {
                  const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown'
                  const albumArt = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url

                  return (
                    <motion.div
                      key={`${track.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/5 hover:border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={albumArt}
                            alt={track.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        </div>

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

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMoveDislikeToLikes(track)}
                            className="p-2 rounded-full hover:bg-green-500/10 transition-colors"
                            title="Move to Likes"
                          >
                            <Heart className="w-5 h-5 text-green-400" fill="currentColor" />
                          </button>
                          <button
                            onClick={() => handleRemoveDislike(track.id)}
                            className="p-2 rounded-full hover:bg-red-500/10 transition-colors"
                            title="Remove from Dislikes"
                          >
                            <Trash2 className="w-4 h-4 text-red-300" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Track List */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-3">
          {tracks.map((track, index) => {
            const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown'
            const albumArt = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url
            const isPlaying = playingTrackId === track.id
            const similar = track.heardSamples?.[0]

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

                  {/* Selector */}
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedTrackIds.includes(track.id)}
                      onChange={() => {
                        setSelectedTrackIds(prev =>
                          prev.includes(track.id)
                            ? prev.filter(id => id !== track.id)
                            : [...prev, track.id]
                        )
                      }}
                      className="w-5 h-5 accent-green-500 cursor-pointer"
                    />
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
                    {similar && (
                      <p className="text-white/50 text-xs truncate mt-1">
                        Similar to: {similar.name} — {similar.artist}
                      </p>
                    )}
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
