export function createPageUrl(name){
  // simple map for demo
  const map = { Home: '/', Favorites: '/favorites', Analytics: '/analytics', Profile: '/profile' }
  return map[name] || '/'
}

// Temporary Playlist Management
const TEMP_PLAYLIST_KEY = 'tunebloom_temp_playlist'
const TEMP_DISLIKES_KEY = 'tunebloom_temp_dislikes'

export const tempPlaylist = {
  // Get all tracks from temporary playlist
  getTracks: () => {
    try {
      const stored = localStorage.getItem(TEMP_PLAYLIST_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  // Add track to temporary playlist
  addTrack: (track) => {
    try {
      const tracks = tempPlaylist.getTracks()
      // Check if track already exists
      if (!tracks.find(t => t.id === track.id)) {
        // Construct URI if not present (format: spotify:track:TRACK_ID)
        const uri = track.uri || `spotify:track:${track.id}`
        
        tracks.push({
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: track.album,
          preview_url: track.preview_url,
          uri: uri,
          addedAt: new Date().toISOString()
        })
        localStorage.setItem(TEMP_PLAYLIST_KEY, JSON.stringify(tracks))
      }
      return tracks
    } catch (error) {
      console.error('Failed to add track to temporary playlist:', error)
      return []
    }
  },

  // Remove track from temporary playlist
  removeTrack: (trackId) => {
    try {
      const tracks = tempPlaylist.getTracks()
      const filtered = tracks.filter(t => t.id !== trackId)
      localStorage.setItem(TEMP_PLAYLIST_KEY, JSON.stringify(filtered))
      return filtered
    } catch (error) {
      console.error('Failed to remove track from temporary playlist:', error)
      return []
    }
  },

  // Clear temporary playlist
  clear: () => {
    try {
      localStorage.removeItem(TEMP_PLAYLIST_KEY)
    } catch (error) {
      console.error('Failed to clear temporary playlist:', error)
    }
  },

  // Get count of tracks
  getCount: () => {
    return tempPlaylist.getTracks().length
  }
}

export const tempDislikes = {
  getTracks: () => {
    try {
      const stored = localStorage.getItem(TEMP_DISLIKES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },
  addTrack: (track) => {
    try {
      const tracks = tempDislikes.getTracks()
      if (!tracks.find(t => t.id === track.id)) {
        const uri = track.uri || `spotify:track:${track.id}`
        tracks.push({
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: track.album,
          preview_url: track.preview_url,
          uri,
          addedAt: new Date().toISOString()
        })
        localStorage.setItem(TEMP_DISLIKES_KEY, JSON.stringify(tracks))
      }
      return tracks
    } catch (error) {
      console.error('Failed to add track to temporary dislikes:', error)
      return []
    }
  },
  removeTrack: (trackId) => {
    try {
      const tracks = tempDislikes.getTracks()
      const filtered = tracks.filter(t => t.id !== trackId)
      localStorage.setItem(TEMP_DISLIKES_KEY, JSON.stringify(filtered))
      return filtered
    } catch (error) {
      console.error('Failed to remove track from temporary dislikes:', error)
      return []
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TEMP_DISLIKES_KEY)
    } catch (error) {
      console.error('Failed to clear temporary dislikes:', error)
    }
  },
  getCount: () => tempDislikes.getTracks().length
}
