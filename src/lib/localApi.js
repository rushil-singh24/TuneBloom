// Local API wrapper - replaces base44 for frontend-only operation
// This provides a simple data layer for the TuneBloom app

// In-memory data store
const dataStore = {
  swipedTracks: [
    { 
      id: 't1', 
      action: 'liked', 
      energy: 0.7, 
      danceability: 0.5, 
      valence: 0.6, 
      tempo: 120, 
      genre: 'pop',
      created_date: new Date('2024-01-15').toISOString()
    },
    { 
      id: 't2', 
      action: 'disliked', 
      energy: 0.3, 
      danceability: 0.2, 
      valence: 0.2, 
      tempo: 85, 
      genre: 'indie',
      created_date: new Date('2024-01-14').toISOString()
    },
    { 
      id: 't3', 
      action: 'liked', 
      energy: 0.8, 
      danceability: 0.6, 
      valence: 0.7, 
      tempo: 140, 
      genre: 'edm',
      created_date: new Date('2024-01-16').toISOString()
    },
    { 
      id: 't4', 
      action: 'liked', 
      energy: 0.65, 
      danceability: 0.7, 
      valence: 0.8, 
      tempo: 128, 
      genre: 'pop',
      created_date: new Date('2024-01-17').toISOString()
    },
    { 
      id: 't5', 
      action: 'liked', 
      energy: 0.9, 
      danceability: 0.85, 
      valence: 0.75, 
      tempo: 135, 
      genre: 'edm',
      created_date: new Date('2024-01-18').toISOString()
    },
    { 
      id: 't6', 
      action: 'disliked', 
      energy: 0.4, 
      danceability: 0.3, 
      valence: 0.3, 
      tempo: 95, 
      genre: 'rock',
      created_date: new Date('2024-01-19').toISOString()
    },
    { 
      id: 't7', 
      action: 'liked', 
      energy: 0.75, 
      danceability: 0.65, 
      valence: 0.7, 
      tempo: 125, 
      genre: 'pop',
      created_date: new Date('2024-01-20').toISOString()
    },
  ]
}

// Simulate API delay for realism
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))

export const localApi = {
  auth: {
    me: async () => {
      await delay()
      return { id: 'user_1', name: 'Music Lover' }
    },
    logout: () => {
      console.log('Logged out')
    }
  },
  
  entities: {
    SwipedTrack: {
      list: async (sort) => {
        await delay()
        let tracks = [...dataStore.swipedTracks]
        
        // Simple sorting (if needed in future)
        if (sort === '-created_date') {
          tracks.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        }
        
        return tracks
      },
      
      filter: async (query, sort) => {
        await delay()
        let tracks = [...dataStore.swipedTracks]
        
        // Apply filters
        if (query && query.action) {
          tracks = tracks.filter(t => t.action === query.action)
        }
        
        // Apply sorting
        if (sort === '-created_date') {
          tracks.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        }
        
        return tracks
      },
      
      create: async (payload) => {
        await delay()
        const newTrack = {
          ...payload,
          id: `t${Date.now()}`,
          created_date: new Date().toISOString()
        }
        dataStore.swipedTracks.unshift(newTrack)
        return newTrack
      },
      
      delete: async (id) => {
        await delay()
        dataStore.swipedTracks = dataStore.swipedTracks.filter(t => t.id !== id)
        return true
      }
    }
  }
}