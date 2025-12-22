// Recommendation Engine
// Content-based filtering for music recommendations

import { spotifyApi } from './spotifyApi'
import { dbService } from './supabaseClient'
import { tempPlaylist } from '../utils'

class RecommendationEngine {
  constructor() {
    this.userProfile = null
    this.excludedTrackIds = new Set()
    this.listenedTrackIds = new Set()
    this.listenedArtistIds = new Set()
    this.persistedExclusions = new Set()
    this.heardTracks = []
    this.heardTrackFeatures = new Map()
    this.currentUser = null
    this.currentUserId = null
    this.feedbackProfile = null
    this.vibeShift = 0
    // Use known valid Spotify seed genres
    this.defaultGenres = ['pop', 'rock', 'indie', 'dance', 'edm']
    this.searchFallbackQueries = ['love', 'night', 'summer', 'dream', 'feel', 'wave']
  }

  loadPersistentExclusions() {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('tunebloom_excluded_ids')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          this.persistedExclusions = new Set(parsed)
          parsed.forEach(id => this.excludedTrackIds.add(id))
        }
      }
    } catch (err) {
      console.warn('Could not load persistent exclusions', err)
    }
  }

  async loadExcludedTracksFromDB() {
    if (!this.currentUserId) return []
    
    try {
      const excludedIds = await dbService.getExcludedTrackIds(this.currentUserId)
      if (Array.isArray(excludedIds)) {
        excludedIds.forEach(id => this.excludedTrackIds.add(id))
        console.log(`✅ Loaded ${excludedIds.length} excluded tracks from database`)
        return excludedIds
      }
    } catch (error) {
      console.warn('Could not load excluded tracks:', error)
    }
    return []
  }

  async saveExcludedTracksToDB(trackIds, reason = 'swiped') {
    if (!this.currentUserId) return
    if (!Array.isArray(trackIds) || trackIds.length === 0) return
    if (!dbService || typeof dbService.addBulkExcludedTracks !== 'function') return
    try {
      await dbService.addBulkExcludedTracks(this.currentUserId, trackIds, reason)
    } catch (err) {
      console.warn('Could not save excluded tracks:', err?.message || err)
    }
  }

  savePersistentExclusions(newIds = []) {
    if (typeof window === 'undefined') return
    try {
      newIds.forEach(id => this.persistedExclusions.add(id))
      // Keep the set bounded to avoid unbounded growth
      const trimmed = Array.from(this.persistedExclusions).slice(-800)
      this.persistedExclusions = new Set(trimmed)
      window.localStorage.setItem('tunebloom_excluded_ids', JSON.stringify(trimmed))
    } catch (err) {
      console.warn('Could not save persistent exclusions', err)
    }
  }

  isTrackExcluded(id) {
    // Safety valve: if exclusions explode, loosen the filter to keep cards flowing
    if (this.excludedTrackIds.size > 4000) return false
    return this.excludedTrackIds.has(id)
  }

  // Calculate average audio features from user's top tracks
  calculateAudioProfile(audioFeatures) {
    const features = ['danceability', 'energy', 'valence', 'tempo', 'acousticness', 'instrumentalness', 'speechiness']
    const safeFeatures = Array.isArray(audioFeatures) ? audioFeatures : []
    
    const profile = {}
    features.forEach(feature => {
      const values = safeFeatures.map(f => f[feature]).filter(v => v !== null && v !== undefined)
      if (values.length > 0) {
        profile[feature] = values.reduce((sum, val) => sum + val, 0) / values.length
      }
    })
    
    return profile
  }

  async getFallbackRecommendations(count = 50, { ignoreExclusions = false } = {}) {
    const recommendations = []
    const seen = new Set()
    const batches = [
      { seed_genres: this.defaultGenres.slice(0, 3).join(','), limit: 25, market: 'from_token' },
      { seed_genres: this.defaultGenres.slice(2, 5).join(','), limit: 25, market: 'from_token' }
    ]

    for (const params of batches) {
      try {
        const response = await spotifyApi.getRecommendations(params)
        response.tracks?.forEach(track => {
          const blocked = !ignoreExclusions && this.isTrackExcluded(track.id)
          if (!seen.has(track.id) && !blocked && this.isAllowedTrack(track)) {
            seen.add(track.id)
            recommendations.push(track)
          }
        })
      } catch (error) {
        console.warn('Fallback recommendation batch failed:', error.message)
      }
    }

    // Always add search-based fallback to guarantee results
    const searchTracks = await this.getSearchFallbackTracks(count * 2, ignoreExclusions)
    searchTracks.forEach(track => {
      const blocked = !ignoreExclusions && this.isTrackExcluded(track.id)
      if (!seen.has(track.id) && !blocked && this.isAllowedTrack(track)) {
        seen.add(track.id)
        recommendations.push(track)
      }
    })

    this.ensureHeardSamples(recommendations)
    return this.shuffleArray(recommendations).slice(0, count)
  }

  async getSearchFallbackTracks(count = 50, ignoreExclusions = false) {
    const tracks = []
    const seen = new Set()
    for (const query of this.searchFallbackQueries) {
      try {
          const response = await spotifyApi.searchTracks(query, 25)
          response.tracks?.items?.forEach(track => {
            const blocked = !ignoreExclusions && this.isTrackExcluded(track.id)
            if (!seen.has(track.id) && !blocked) {
              seen.add(track.id)
              tracks.push(track)
            }
          })
        } catch (error) {
          console.warn('Search fallback failed:', error.message)
        }
      if (tracks.length >= count) break
    }
    return tracks.slice(0, count)
  }

  sanitizeParams(params = {}) {
    const clean = {}
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      clean[key] = value
    })
    return clean
  }

  cleanGenres(list = [], max = 5) {
    return list
      .map(item => (item || '').toString().toLowerCase().replace(/\s+/g, '-'))
      .filter(Boolean)
      .slice(0, max)
  }

  cleanSeedList(list = [], max = 5) {
    return list
      .map(item => (item || '').toString().trim())
      .filter(Boolean)
      .slice(0, max)
  }

  isAllowedTrack(track) {
    // Allow track; track/artist exclusions handled separately
    return !!track
  }

  shuffleArray(list = []) {
    const arr = [...list]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  getSimilarHeardTracks(track, count = 3) {
    if (!track || (!track.audioFeatures && this.heardTrackFeatures.size === 0)) {
      return this.sampleHeardTracks(count)
    }

    const features = track.audioFeatures
    const candidates = []
    const recGenres = new Set(
      (track.artists || []).flatMap(a => a.genres || []).map(g => g.toLowerCase())
    )
    const hasRecGenres = recGenres.size > 0

    this.heardTracks.forEach(ht => {
      const hf = this.heardTrackFeatures.get(ht.id)
      if (!hf || !features) return

      // Prefer same primary artist match first
      const sharesArtist = ht.artists?.some(a => track.artists?.some(ta => ta.id === a.id))
      const coreDistance = this.calculateSimilarity(hf, features)

      // Penalize tempo gaps to stay in similar vibe
      const tempoA = hf.tempo
      const tempoB = features.tempo
      const tempoPenalty = tempoA && tempoB ? Math.min(1, Math.abs(tempoA - tempoB) / 200) * 0.6 : 0

      // Genre match: reward overlap, penalize none
      const htGenres = new Set((ht.artists || []).flatMap(a => a.genres || []).map(g => g.toLowerCase()))
      const overlap = [...recGenres].filter(g => htGenres.has(g))
      const genrePenalty = hasRecGenres ? (overlap.length ? -0.1 * Math.min(3, overlap.length) : 0.35) : 0

      const score = coreDistance + tempoPenalty + genrePenalty + (sharesArtist ? -0.08 : 0)

      candidates.push({
        id: ht.id,
        name: ht.name,
        artist: ht.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        similarity: score
      })
    })

    if (!candidates.length) {
      return this.sampleHeardTracks(count)
    }

    // Filter to tightest matches first to avoid random far-off picks
    const sorted = candidates.sort((a, b) => a.similarity - b.similarity)
    const topTight = sorted.filter(c => c.similarity <= 0.7)
    const pool = topTight.length >= count ? topTight : sorted

    return pool.slice(0, count).map(({ similarity, ...rest }) => rest)
  }

  buildRecParams({ tracks = [], artists = [], genres = [], limit = 20, ...targets }) {
    const params = { limit, market: 'from_token', ...targets }
    if (tracks.length) params.seed_tracks = tracks.slice(0, 5).join(',')
    if (artists.length) params.seed_artists = artists.slice(0, 5).join(',')
    if (genres.length) params.seed_genres = genres.slice(0, 5).join(',')
    return this.sanitizeParams(params)
  }

  ensureHeardSamples(tracks = []) {
    tracks.forEach(track => {
      if (!track.heardSamples || !track.heardSamples.length) {
        track.heardSamples = this.sampleHeardTracks(3)
      }
    })
    return tracks
  }

  sampleHeardTracks(count = 3) {
    if (!this.heardTracks.length) return []
    const shuffled = this.shuffleArray(this.heardTracks)
    return shuffled.slice(0, count).map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
    }))
  }

  buildFeedbackProfile(likedTracks = []) {
    if (!Array.isArray(likedTracks) || likedTracks.length === 0) return null

    // Aggregate audio features from liked tracks (if available)
    const featureFields = ['danceability', 'energy', 'valence', 'tempo', 'acousticness', 'instrumentalness', 'speechiness']
    const featureSums = {}
    const featureCounts = {}

    likedTracks.forEach(track => {
      const features = track.audioFeatures
      if (!features) return
      featureFields.forEach(field => {
        if (typeof features[field] === 'number') {
          featureSums[field] = (featureSums[field] || 0) + features[field]
          featureCounts[field] = (featureCounts[field] || 0) + 1
        }
      })
    })

    const averagedFeatures = {}
    featureFields.forEach(field => {
      if (featureCounts[field]) {
        averagedFeatures[field] = featureSums[field] / featureCounts[field]
      }
    })

    // Collect liked artists/genres seeds
    const artistCounts = {}
    const genreCounts = {}
    likedTracks.forEach(track => {
      (track.artists || []).forEach(artist => {
        if (artist.id) {
          artistCounts[artist.id] = (artistCounts[artist.id] || 0) + 1
        }
        if (artist.genres) {
          artist.genres.forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1
          })
        }
      })
    })

    const topLikedArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const topLikedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre)

    const likedTrackSeeds = likedTracks.slice(-5).map(t => t.id).filter(Boolean)

    return {
      averagedFeatures,
      topLikedArtists,
      topLikedGenres,
      likedTrackSeeds
    }
  }

  setVibeShift(vibeShift = 0) {
    this.vibeShift = vibeShift
  }

  async getComprehensiveTopTracks() {
    const ranges = ['short_term', 'medium_term', 'long_term']
    const seen = new Set()
    const tracks = []

    for (const range of ranges) {
      try {
        const response = await spotifyApi.getTopTracks(range, 50)
        if (response.items) {
          response.items.forEach(track => {
            if (!seen.has(track.id)) {
              seen.add(track.id)
              tracks.push(track)
            }
          })
        }
      } catch (error) {
        console.warn(`Failed to fetch top tracks for range ${range}:`, error)
      }
    }

    return tracks
  }

  async getAllSavedTrackIds(maxToFetch = 200) {
    const ids = []
    const limit = 50
    let offset = 0

    while (ids.length < maxToFetch) {
      try {
        const response = await spotifyApi.getSavedTracks(limit, offset)
        if (!response.items || response.items.length === 0) break

        response.items.forEach(item => {
          if (item.track?.id) {
            ids.push(item.track.id)
          }
        })

        offset += response.items.length
        if (response.items.length < limit) break
      } catch (error) {
        console.warn('Failed to fetch all saved tracks:', error)
        break
      }
    }

    return ids
  }

  async getRecentlyPlayedIds(limit = 50) {
    try {
      const recentlyPlayed = await spotifyApi.getRecentlyPlayed(limit)
      return recentlyPlayed.items?.map(item => item.track?.id).filter(Boolean) || []
    } catch (error) {
      console.warn('Could not fetch recently played tracks:', error)
      return []
    }
  }

  async getRecentlyPlayedTracks(limit = 50) {
    try {
      const recentlyPlayed = await spotifyApi.getRecentlyPlayed(limit)
      return recentlyPlayed.items?.map(item => item.track).filter(Boolean) || []
    } catch (error) {
      console.warn('Could not fetch recently played track objects:', error)
      return []
    }
  }

  async getSavedTrackObjects(limit = 50, offset = 0) {
    try {
      const saved = await spotifyApi.getSavedTracks(limit, offset)
      return saved.items?.map(item => item.track).filter(Boolean) || []
    } catch (error) {
      console.warn('Could not fetch saved track objects:', error)
      return []
    }
  }

  collectArtistIdsFromTracks(tracks = []) {
    tracks.forEach(track => {
      track?.artists?.forEach(artist => {
        if (artist?.id) this.listenedArtistIds.add(artist.id)
      })
    })
  }

  async getPlaylistTrackIds(maxPlaylists = 5, maxTracksPerList = 150, overallCap = 400) {
    const trackIds = []
    try {
      const playlistsResponse = await spotifyApi.getUserPlaylists(maxPlaylists)
      const playlists = playlistsResponse.items || []

      for (const playlist of playlists.slice(0, maxPlaylists)) {
        if (trackIds.length >= overallCap) break
        const limit = 100
        let offset = 0
        while (trackIds.length < maxTracksPerList) {
          const response = await spotifyApi.getPlaylistTracks(playlist.id, limit, offset)
          const items = response.items || []
          items.forEach(item => {
            const track = item.track
            if (track?.id) {
              trackIds.push(track.id)
              this.collectArtistIdsFromTracks([track])
            }
          })
          if (items.length < limit) break
          offset += items.length
          if (trackIds.length >= overallCap) break
        }
      }
    } catch (error) {
      console.warn('Unable to fetch playlist tracks:', error)
    }

    return trackIds
  }

  // Build user music profile from top tracks
  async buildUserProfile() {
    try {
      this.excludedTrackIds.clear()
      this.listenedTrackIds.clear()
      this.listenedArtistIds.clear()
      this.heardTracks = []
      this.loadPersistentExclusions()

      // Fetch user data early so it's ready elsewhere in the app
      try {
        this.currentUser = await spotifyApi.getCurrentUser()
        if (this.currentUser?.id) {
          this.currentUserId = this.currentUser.id
        }
      } catch (error) {
        console.warn('Unable to fetch current user during profile build:', error)
      }

      // Load server-side exclusions if available
      try {
        await this.loadExcludedTracksFromDB()
      } catch (error) {
        console.warn('Unable to load excluded tracks from db:', error)
      }

      // Safety: if exclusions balloon, clear them to keep recommendations flowing
      if (this.excludedTrackIds.size > 5000) {
        console.warn('Exclusion set too large; clearing to restore recommendations')
        this.excludedTrackIds.clear()
      }

      // Get user's top tracks across ranges
      let topTracks = []
      try {
        topTracks = await this.getComprehensiveTopTracks()
      } catch (error) {
        console.warn('Failed to load top tracks:', error)
      }

      if (!topTracks || topTracks.length === 0) {
        console.warn('No top tracks found, using saved tracks as fallback seeds')
        topTracks = await this.getSavedTrackObjects(50)
      }
      if (!topTracks || topTracks.length === 0) {
        console.warn('No saved tracks found, using recently played as fallback seeds')
        topTracks = await this.getRecentlyPlayedTracks(50)
      }
      this.heardTracks = topTracks || []

      // Get audio features for heard tracks (chunked to avoid API limits)
      const trackIds = this.heardTracks.map(t => t.id)
      const audioFeatures = trackIds.length ? await this.fetchAudioFeatures(trackIds.slice(0, 120)) : []
      const featureMap = new Map()
      audioFeatures.forEach(f => {
        if (f?.id) featureMap.set(f.id, f)
      })
      this.heardTrackFeatures = featureMap

      // Calculate average profile
      const audioProfile = this.calculateAudioProfile(audioFeatures)
      
      // Get top artists and genres
      let topArtists = { items: [] }
      try {
        topArtists = await spotifyApi.getTopArtists('medium_term', 20)
      } catch (error) {
        console.warn('Failed to fetch top artists:', error)
      }
      const topGenres = this.extractTopGenres(topArtists.items || [])
      
      // Build exclusion list from listening history so we only recommend tracks never played before
      const savedTrackIds = await this.getAllSavedTrackIds()
      const recentlyPlayedIds = await this.getRecentlyPlayedIds(50)
      const tempLikedIds = tempPlaylist.getTracks().map(t => t.id).filter(Boolean)
      // Include a limited set of playlist tracks to better avoid repeats
      const playlistTrackIds = await this.getPlaylistTrackIds(5, 150, 400)

      // Persist known-listened tracks to db exclusions (best effort)
      if (this.currentUserId) {
        const toPersist = [
          { ids: savedTrackIds, reason: 'in_library' },
          { ids: recentlyPlayedIds, reason: 'recently_played' },
          { ids: playlistTrackIds, reason: 'in_library' }
        ]
        for (const batch of toPersist) {
          if (batch.ids.length) {
            try {
              await this.saveExcludedTracksToDB(batch.ids, batch.reason)
            } catch (err) {
              console.warn('Failed to persist exclusions batch:', err?.message || err)
            }
          }
        }
      }

      this.listenedTrackIds = new Set([
        ...trackIds,
        ...savedTrackIds,
        ...recentlyPlayedIds,
        ...tempLikedIds,
        ...playlistTrackIds
      ])

      // Track artists the listener has played
      topTracks.forEach(track => {
        track.artists?.forEach(artist => {
          if (artist?.id) this.listenedArtistIds.add(artist.id)
        })
      })
      this.listenedTrackIds.forEach(id => this.excludedTrackIds.add(id))

      this.userProfile = {
        audioProfile,
        topArtists: (topArtists.items || []).map(a => a.id),
        topGenres: topGenres.length ? topGenres : this.defaultGenres,
        seedTracks: topTracks.slice(0, 5).map(t => t.id)
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

  async fetchAudioFeatures(ids = []) {
    const validIds = ids.filter(Boolean)
    const chunkSize = 50 // stay well under Spotify's 100 limit
    const allFeatures = []

    for (let i = 0; i < validIds.length; i += chunkSize) {
      const chunk = validIds.slice(i, i + chunkSize)
      if (!chunk.length) continue
      try {
        const response = await spotifyApi.getAudioFeatures(chunk)
        if (response?.audio_features) {
          allFeatures.push(...response.audio_features.filter(Boolean))
        }
      } catch (error) {
        console.warn('Audio features fetch failed, skipping features for this chunk:', error.message)
      }
    }

    return allFeatures
  }

  // Generate recommendations
  async generateRecommendations(count = 100, options = {}) {
    const { likedTracks = [], vibeShift = 0 } = options
    this.setVibeShift(vibeShift)
    this.feedbackProfile = this.buildFeedbackProfile(likedTracks)

    if (!this.userProfile) {
      try {
        await this.buildUserProfile()
      } catch (error) {
        console.warn('User profile build failed, falling back to default seeds:', error.message)
        this.userProfile = {
          audioProfile: {},
          topArtists: [],
          topGenres: this.defaultGenres,
          seedTracks: []
        }
      }
    }

    const { audioProfile, seedTracks, topGenres } = this.userProfile
    const recommendations = []
    const seenIds = new Set()

      const seedTracksClean = (seedTracks || []).filter(Boolean).slice(0, 5)
    const seedArtistsClean = (this.userProfile?.topArtists || []).filter(Boolean).slice(0, 5)
    const seedGenresClean = this.cleanGenres(topGenres?.length ? topGenres : this.defaultGenres, 5)

    // Build dynamic seeds: start with user profile seeds, then bias toward liked feedback
    const feedbackSeeds = (this.feedbackProfile?.likedTrackSeeds || []).filter(Boolean)
    const artistSeeds = this.cleanSeedList(this.feedbackProfile?.topLikedArtists || seedArtistsClean, 5)
    const genreSeeds = this.cleanGenres(this.feedbackProfile?.topLikedGenres || seedGenresClean, 5)
    const trackSeeds = feedbackSeeds.length ? feedbackSeeds : seedTracksClean

    // Ensure we always have some seeds to avoid 404 from Spotify
    const safeTrackSeeds = trackSeeds.length ? trackSeeds : []
    const safeArtistSeeds = artistSeeds.length ? artistSeeds : []
    const safeGenreSeeds = genreSeeds.length ? genreSeeds : this.cleanGenres(this.defaultGenres, 3)

    // Slightly vary targets based on vibeShift to refresh the "vibe"
    const vibeAmount = (vibeShift % 5) * 0.05
    const targetDance = this.feedbackProfile?.averagedFeatures?.danceability ?? audioProfile?.danceability
    const targetEnergy = this.feedbackProfile?.averagedFeatures?.energy ?? audioProfile?.energy
    const targetValence = this.feedbackProfile?.averagedFeatures?.valence ?? audioProfile?.valence

    try {
      const batches = [
        // Batch 1: Based on seed tracks
        this.buildRecParams({
          tracks: [...feedbackSeeds, ...safeTrackSeeds],
          artists: safeArtistSeeds.slice(0, 2),
          limit: 30,
          target_danceability: targetDance,
          target_energy: targetEnergy,
          target_valence: targetValence
        }),
        // Batch 2: Based on genres
        this.buildRecParams({
          genres: safeGenreSeeds,
          artists: safeArtistSeeds.slice(0, 2),
          limit: 30,
          target_danceability: targetDance ? Math.min(1, targetDance + vibeAmount) : undefined,
          target_energy: targetEnergy ? Math.max(0, targetEnergy - vibeAmount) : undefined,
          target_valence: targetValence ? Math.min(1, targetValence + vibeAmount) : undefined
        }),
        // Batch 3: Slightly different parameters for variety
        this.buildRecParams({
          tracks: [...feedbackSeeds.slice(0, 3), ...safeTrackSeeds.slice(2, 5)],
          limit: 25,
          min_energy: targetEnergy ? Math.max(0, targetEnergy - 0.2 - vibeAmount) : undefined,
          max_energy: targetEnergy ? Math.min(1, targetEnergy + 0.2 + vibeAmount) : undefined,
          min_danceability: targetDance ? Math.max(0, targetDance - 0.2) : undefined
        }),
        // Batch 4: Explore similar tempo
        this.buildRecParams({
          tracks: [...feedbackSeeds.slice(0, 2), ...safeTrackSeeds],
          artists: safeArtistSeeds.slice(0, 2),
          limit: 25,
          target_tempo: this.feedbackProfile?.averagedFeatures?.tempo ?? audioProfile.tempo,
          target_danceability: targetDance,
          target_valence: targetValence
        })
      ].filter(batch => Object.keys(batch).some(key => key.startsWith('seed_')))

      if (!batches.length) {
        console.warn('No valid seeds available for recommendations; returning fallback list')
        const fallback = await this.getFallbackRecommendations(count, { ignoreExclusions: true })
        return fallback
      }

      // Fetch all batches
      for (const params of batches) {
        try {
          const response = await spotifyApi.getRecommendations(params)
          
          if (response.tracks) {
            response.tracks.forEach(track => {
              // Filter out duplicates, excluded tracks, and enforce unheard artists
              const blocked = this.isTrackExcluded(track.id)
              if (!seenIds.has(track.id) && !blocked && this.isAllowedTrack(track)) {
                seenIds.add(track.id)
                recommendations.push(track)
              }
            })
          }
        } catch (error) {
          console.warn('Batch recommendation failed:', error.message || error)
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Get audio features for all recommendations (best effort)
      if (recommendations.length > 0) {
        try {
          const ids = recommendations.map(t => t.id)
          const features = await this.fetchAudioFeatures(ids)
          const featuresById = new Map()
          features.forEach(f => {
            if (f?.id) featuresById.set(f.id, f)
          })

          recommendations.forEach(track => {
            track.audioFeatures = featuresById.get(track.id)
            // Attach heard samples for UI
            track.heardSamples = this.getSimilarHeardTracks(track, 3)
            // Drop any preview fields; we don't use previews
            delete track.preview_url
          })
        } catch (err) {
          console.warn('Audio features fetch skipped:', err?.message || err)
        }

        // Ensure heardSamples exist even if features were missing
        recommendations.forEach(track => {
          if (!track.heardSamples || !track.heardSamples.length) {
            track.heardSamples = this.sampleHeardTracks(3)
          }
        })
      }

      const baseList = recommendations

      // Remove any track that slips through from the user's listening history
      const unseenRecommendations = baseList.filter(
        track => !this.isTrackExcluded(track.id) && !this.listenedTrackIds.has(track.id) && this.isAllowedTrack(track)
      )

      // If almost everything was excluded, relax to allow seen tracks so UI still shows cards
      let workingList = unseenRecommendations
      if (workingList.length < 10 && recommendations.length) {
        const deduped = []
        const seenDedup = new Set()
        recommendations.forEach(track => {
          if (!seenDedup.has(track.id)) {
            seenDedup.add(track.id)
            deduped.push(track)
          }
        })
        workingList = deduped
      }

      // If primary batches failed to deliver, fetch fallback to guarantee cards
      if (workingList.length < count / 2 || workingList.length === 0) {
        const fallback = await this.getFallbackRecommendations(count, { ignoreExclusions: workingList.length === 0 })
        const merged = [...workingList]
        const seenIdsMerged = new Set(merged.map(t => t.id))
        fallback.forEach(track => {
          if (
            !seenIdsMerged.has(track.id) &&
            !this.listenedTrackIds.has(track.id) &&
            this.isAllowedTrack(track)
          ) {
            merged.push(track)
            seenIdsMerged.add(track.id)
          }
        })
        recommendations.length = 0
        if (merged.length === 0) {
          // Last resort: use fallback even if it includes previously seen tracks
          recommendations.push(...fallback.slice(0, count))
        } else {
          recommendations.push(...merged)
        }
      } else {
        recommendations.length = 0
        recommendations.push(...workingList)
      }

      // Shuffle before ranking to avoid any stable ordering
      const randomized = this.shuffleArray(recommendations)

      // Ensure similar samples exist for UI
      this.ensureHeardSamples(randomized)

      // Sort by similarity to user profile
      const rankedSource = randomized.length ? randomized : unseenRecommendations
      const sortedRecommendations = this.rankBySimilarity(rankedSource, audioProfile || {})

      if (sortedRecommendations.length === 0) {
        console.warn('No recommendations after filtering; using fallback set')
        const fallback = await this.getFallbackRecommendations(count, { ignoreExclusions: true })
        return fallback.slice(0, count)
      }

      const finalList = sortedRecommendations.slice(0, count)
      // Persist exclusions so future sessions avoid repeats
      const finalIds = finalList.map(t => t.id)
      this.savePersistentExclusions(finalIds)
      if (this.currentUserId && finalIds.length) {
        this.saveExcludedTracksToDB(finalIds, 'served').catch(() => {})
      }
      return finalList
    } catch (error) {
      console.error('Error generating recommendations:', error)
      throw error
    }
  }

  // Calculate Euclidean distance for similarity
  calculateSimilarity(trackFeatures, userProfile = {}) {
    const features = ['danceability', 'energy', 'valence']
    
    let distance = 0
    features.forEach(feature => {
      const userValue = userProfile[feature]
      if (trackFeatures[feature] !== null && userValue !== null && userValue !== undefined) {
        distance += Math.pow(trackFeatures[feature] - userProfile[feature], 2)
      }
    })
    
    return Math.sqrt(distance)
  }

  // Rank tracks by similarity
  rankBySimilarity(tracks, userProfile) {
    const jitter = () => (Math.random() - 0.5) * 0.1
    return tracks
      .map(track => ({
        ...track,
        similarity: track.audioFeatures 
          ? this.calculateSimilarity(track.audioFeatures, userProfile)
          : 999
      }))
      .sort((a, b) => {
        const diff = a.similarity - b.similarity
        if (Math.abs(diff) < 0.0001) return jitter()
        return diff
      })
  }

  // Add track to exclusion list
  excludeTrack(trackId) {
    this.excludedTrackIds.add(trackId)
    this.listenedTrackIds.add(trackId)
    if (this.currentUserId) {
      this.saveExcludedTracksToDB([trackId], 'swiped').catch(() => {})
    }
  }

  removeExclusion(trackId) {
    this.excludedTrackIds.delete(trackId)
    this.listenedTrackIds.delete(trackId)
  }

  // Reset engine
  reset() {
    this.userProfile = null
    this.excludedTrackIds.clear()
    this.listenedTrackIds.clear()
    this.listenedArtistIds.clear()
    this.currentUser = null
    this.currentUserId = null
    this.feedbackProfile = null
    this.vibeShift = 0
  }
}

export const recommendationEngine = new RecommendationEngine()
