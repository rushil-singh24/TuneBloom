// Recommendation Engine
// Content-based filtering for music recommendations

import { spotifyApi } from './spotifyApi'

class RecommendationEngine {
  constructor() {
    this.userProfile = null
    this.excludedTrackIds = new Set()
  }

  // Calculate average audio features from user's top tracks
  calculateAudioProfile(audioFeatures) {
    const features = ['danceability', 'energy', 'valence', 'tempo', 'acousticness', 'instrumentalness', 'speechiness']
    
    const profile = {}
    features.forEach(feature => {
      const values = audioFeatures.map(f => f[feature]).filter(v => v !== null && v !== undefined)
      if (values.length > 0) {
        profile[feature] = values.reduce((sum, val) => sum + val, 0) / values.length
      }
    })
    
    return profile
  }

  // Build user music profile from top tracks
  async buildUserProfile() {
    try {
      // Get user's top tracks
      const topTracks = await spotifyApi.getTopTracks('medium_term', 50)
      
      if (!topTracks.items || topTracks.items.length === 0) {
        throw new Error('No top tracks found')
      }

      // Get audio features for top tracks
      const trackIds = topTracks.items.map(t => t.id)
      const audioFeaturesResponse = await spotifyApi.getAudioFeatures(trackIds)
      
      // Calculate average profile
      const audioProfile = this.calculateAudioProfile(audioFeaturesResponse.audio_features)
      
      // Get top artists and genres
      const topArtists = await spotifyApi.getTopArtists('medium_term', 20)
      const topGenres = this.extractTopGenres(topArtists.items)
      
      // Get user's saved tracks to exclude from recommendations
      const savedTracks = await spotifyApi.getSavedTracks(50)
      savedTracks.items.forEach(item => this.excludedTrackIds.add(item.track.id))
      
      // Add top tracks to exclusion list
      topTracks.items.forEach(track => this.excludedTrackIds.add(track.id))

      this.userProfile = {
        audioProfile,
        topArtists: topArtists.items.map(a => a.id),
        topGenres,
        seedTracks: topTracks.items.slice(0, 5).map(t => t.id)
      }

      return this.userProfile
    } catch (error) {
      console.error('Error building user profile:', error)
      throw error
    }
  }

  // Extract most common genres from artists
  extractTopGenres(artists, limit = 5) {
    const genreCount = {}
    
    artists.forEach(artist => {
      if (artist.genres) {
        artist.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        })
      }
    })
    
    return Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genre]) => genre)
  }

  // Generate recommendations
  async generateRecommendations(count = 100) {
    if (!this.userProfile) {
      await this.buildUserProfile()
    }

    const { audioProfile, seedTracks, topGenres } = this.userProfile
    const recommendations = []
    const seenIds = new Set()

    try {
      // Make multiple API calls to get diverse recommendations
      const batches = [
        // Batch 1: Based on seed tracks
        {
          seed_tracks: seedTracks.slice(0, 5).join(','),
          limit: 30,
          target_danceability: audioProfile.danceability,
          target_energy: audioProfile.energy,
          target_valence: audioProfile.valence
        },
        // Batch 2: Based on genres
        {
          seed_genres: topGenres.slice(0, 3).join(','),
          limit: 30,
          target_danceability: audioProfile.danceability,
          target_energy: audioProfile.energy
        },
        // Batch 3: Slightly different parameters for variety
        {
          seed_tracks: seedTracks.slice(2, 5).join(','),
          limit: 25,
          min_energy: Math.max(0, audioProfile.energy - 0.15),
          max_energy: Math.min(1, audioProfile.energy + 0.15)
        },
        // Batch 4: Explore similar tempo
        {
          seed_tracks: seedTracks.slice(0, 3).join(','),
          limit: 25,
          target_tempo: audioProfile.tempo,
          target_danceability: audioProfile.danceability
        }
      ]

      // Fetch all batches
      for (const params of batches) {
        try {
          const response = await spotifyApi.getRecommendations(params)
          
          if (response.tracks) {
            response.tracks.forEach(track => {
              // Filter out duplicates and excluded tracks
              if (!seenIds.has(track.id) && !this.excludedTrackIds.has(track.id)) {
                seenIds.add(track.id)
                recommendations.push(track)
              }
            })
          }
        } catch (error) {
          console.warn('Batch recommendation failed:', error)
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Get audio features for all recommendations
      if (recommendations.length > 0) {
        const chunkSize = 100 // Spotify API limit
        for (let i = 0; i < recommendations.length; i += chunkSize) {
          const chunk = recommendations.slice(i, i + chunkSize)
          const ids = chunk.map(t => t.id)
          const featuresResponse = await spotifyApi.getAudioFeatures(ids)
          
          // Attach audio features to tracks
          chunk.forEach((track, index) => {
            track.audioFeatures = featuresResponse.audio_features[index]
          })
        }
      }

      // Sort by similarity to user profile
      const sortedRecommendations = this.rankBySimilarity(recommendations, audioProfile)

      return sortedRecommendations.slice(0, count)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      throw error
    }
  }

  // Calculate Euclidean distance for similarity
  calculateSimilarity(trackFeatures, userProfile) {
    const features = ['danceability', 'energy', 'valence']
    
    let distance = 0
    features.forEach(feature => {
      if (trackFeatures[feature] !== null && userProfile[feature] !== null) {
        distance += Math.pow(trackFeatures[feature] - userProfile[feature], 2)
      }
    })
    
    return Math.sqrt(distance)
  }

  // Rank tracks by similarity
  rankBySimilarity(tracks, userProfile) {
    return tracks
      .map(track => ({
        ...track,
        similarity: track.audioFeatures 
          ? this.calculateSimilarity(track.audioFeatures, userProfile)
          : 999
      }))
      .sort((a, b) => a.similarity - b.similarity)
  }

  // Add track to exclusion list
  excludeTrack(trackId) {
    this.excludedTrackIds.add(trackId)
  }

  // Reset engine
  reset() {
    this.userProfile = null
    this.excludedTrackIds.clear()
  }
}

export const recommendationEngine = new RecommendationEngine()