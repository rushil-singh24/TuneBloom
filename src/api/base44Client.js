export const base44 = {
  auth: {
    me: async () => ({ id: 'user_1', name: 'Test User' }),
    logout: () => {}
  },
  entities: {
    SwipedTrack: {
      _data: [
        { id: 't1', action: 'liked', energy: 0.7, danceability: 0.5, valence: 0.6, tempo: 120, genre: 'pop' },
        { id: 't2', action: 'disliked', energy: 0.3, danceability: 0.2, valence: 0.2, tempo: 85, genre: 'indie' },
        { id: 't3', action: 'liked', energy: 0.8, danceability: 0.6, valence: 0.7, tempo: 140, genre: 'edm' }
      ],
      list: async (sort) => {
        // ignore sort in stub
        return base44.entities.SwipedTrack._data
      },
      filter: async (query, sort) => {
        if(query && query.action) return base44.entities.SwipedTrack._data.filter(t => t.action === query.action)
        return base44.entities.SwipedTrack._data
      },
      create: async (payload) => { base44.entities.SwipedTrack._data.unshift(payload); return payload },
      delete: async (id) => { base44.entities.SwipedTrack._data = base44.entities.SwipedTrack._data.filter(t=>t.id!==id); return true }
    }
  }
}
