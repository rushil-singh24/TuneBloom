import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null

// Database service for TuneBloom
export const dbService = {
  // ==================== USER MANAGEMENT ====================
  // userPayload should include:
  // id (Supabase auth user id), spotify_id, display_name, email, profile_image_url, spotify_product, country
  async createOrUpdateUser(userPayload) {
    if (!supabase) return null
    const supaId = userPayload?.id
    const spotifyId = userPayload?.spotify_id || userPayload?.spotifyId
    if (!supaId || !spotifyId) {
      console.warn('createOrUpdateUser missing ids')
      return null
    }
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: supaId,
        spotify_id: spotifyId,
        display_name: userPayload.display_name,
        email: userPayload.email,
        profile_image_url: userPayload.profile_image_url,
        spotify_product: userPayload.spotify_product,
        country: userPayload.country,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getUser(userId) {
    if (!supabase || !userId) return null
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  },

  // ==================== USER PREFERENCES ====================
  async upsertUserPreferences(userId, preferences) {
    if (!supabase || !userId) return null
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        audio_profile: preferences.audioProfile,
        favorite_genres: preferences.favoriteGenres,
        excluded_artists: preferences.excludedArtists || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getUserPreferences(userId) {
    if (!supabase || !userId) return null
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error // Ignore not found
    return data
  },

  // ==================== DAILY SESSIONS ====================
  async getTodaySession(userId) {
    if (!supabase || !userId) return null
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', today)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getDailySessions(userId, limit = 30) {
    if (!supabase || !userId) return []
    const { data, error } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  async getSessionSwipes(sessionId) {
    if (!supabase || !sessionId) return []
    const { data, error } = await supabase
      .from('swiped_tracks')
      .select('*')
      .eq('session_id', sessionId)
      .order('swiped_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // ==================== SWIPED TRACKS ====================
  async saveSwipedTrack(userId, track, action) {
    if (!supabase || !userId || !track) return null
    // Get or create today's session using the database function
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('upsert_daily_session', {
        p_user_id: userId,
        p_action: action
      })
    if (sessionError) throw sessionError
    const sessionId = sessionData

    const { data, error } = await supabase
      .from('swiped_tracks')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        track_id: track.id,
        track_name: track.name,
        artist_names: track.artists?.map(a => a.name).join(', ') || 'Unknown',
        album_name: track.album?.name,
        album_image_url: track.album?.images?.[0]?.url,
        track_uri: track.uri || `spotify:track:${track.id}`,
        preview_url: track.preview_url,
        action: action,
        energy: track.audioFeatures?.energy,
        danceability: track.audioFeatures?.danceability,
        valence: track.audioFeatures?.valence,
        tempo: track.audioFeatures?.tempo,
        acousticness: track.audioFeatures?.acousticness,
        instrumentalness: track.audioFeatures?.instrumentalness,
        speechiness: track.audioFeatures?.speechiness,
        genre: track.artists?.[0]?.genres?.[0] || null,
        swiped_at: new Date().toISOString()
      }, { onConflict: 'user_id,track_id', ignoreDuplicates: false })
      .select()
      .single()
    if (error) throw error

    await this.addExcludedTrack(userId, track.id, 'swiped')
    return data
  },

  async getLikedTracks(userId, limit = 100) {
    if (!supabase || !userId) return []
    const { data, error } = await supabase
      .from('swiped_tracks')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'liked')
      .order('swiped_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  async getAllSwipedTracks(userId, limit = 200) {
    if (!supabase || !userId) return []
    const { data, error } = await supabase
      .from('swiped_tracks')
      .select('*')
      .eq('user_id', userId)
      .order('swiped_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  async deleteSwipedTrack(userId, trackId) {
    if (!supabase || !userId || !trackId) return
    const { error } = await supabase
      .from('swiped_tracks')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId)
    if (error) throw error
    await supabase
      .from('excluded_tracks')
      .delete()
      .eq('user_id', userId)
      .eq('track_id', trackId)
  },

  // ==================== EXCLUDED TRACKS ====================
  async addExcludedTrack(userId, trackId, reason = 'swiped') {
    if (!supabase || !userId || !trackId) return
    const { error } = await supabase
      .from('excluded_tracks')
      .upsert({
        user_id: userId,
        track_id: trackId,
        reason,
        excluded_at: new Date().toISOString()
      }, { onConflict: 'user_id,track_id', ignoreDuplicates: true })
    if (error && error.code !== '23505') {
      console.warn('Failed to add excluded track:', error)
    }
  },

  async addBulkExcludedTracks(userId, trackIds, reason = 'in_library') {
    if (!supabase || !userId || !trackIds?.length) return
    const records = trackIds.map(trackId => ({
      user_id: userId,
      track_id: trackId,
      reason,
      excluded_at: new Date().toISOString()
    }))
    const chunkSize = 500
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      await supabase
        .from('excluded_tracks')
        .upsert(chunk, { onConflict: 'user_id,track_id', ignoreDuplicates: true })
    }
  },

  async getExcludedTrackIds(userId) {
    if (!supabase || !userId) return []
    const { data, error } = await supabase
      .from('excluded_tracks')
      .select('track_id')
      .eq('user_id', userId)
    if (error) throw error
    return data?.map(row => row.track_id) || []
  },

  async isTrackExcluded(userId, trackId) {
    if (!supabase || !userId || !trackId) return false
    const { data } = await supabase
      .from('excluded_tracks')
      .select('track_id')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .single()
    return !!data
  },

  // ==================== CREATED PLAYLISTS ====================
  async saveCreatedPlaylist(userId, playlistData) {
    if (!supabase || !userId || !playlistData) return null
    const { data, error } = await supabase
      .from('created_playlists')
      .insert({
        user_id: userId,
        spotify_playlist_id: playlistData.id,
        playlist_name: playlistData.name,
        track_count: playlistData.trackCount || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getCreatedPlaylists(userId) {
    if (!supabase || !userId) return []
    const { data, error } = await supabase
      .from('created_playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addPlaylistTracks(playlistId, trackIds) {
    if (!supabase || !playlistId || !trackIds?.length) return
    const records = trackIds.map(trackId => ({
      playlist_id: playlistId,
      track_id: trackId,
      added_at: new Date().toISOString()
    }))
    const { error } = await supabase
      .from('playlist_tracks')
      .insert(records)
    if (error) throw error
  },

  // ==================== ANALYTICS ====================
  async getUserStats(userId) {
    if (!supabase || !userId) return { totalSwipes: 0, likedCount: 0, dislikedCount: 0, likeRate: 0, lastSession: null }
    const { data: swipes, error: swipesError } = await supabase
      .from('swiped_tracks')
      .select('action', { count: 'exact' })
      .eq('user_id', userId)
    const { data: sessions, error: sessionsError } = await supabase
      .from('daily_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(1)
    if (swipesError) throw swipesError
    if (sessionsError) console.warn('getUserStats sessions error', sessionsError)
    const totalSwipes = swipes?.length || 0
    const likedCount = swipes?.filter(s => s.action === 'liked').length || 0
    const dislikedCount = swipes?.filter(s => s.action === 'disliked').length || 0
    return {
      totalSwipes,
      likedCount,
      dislikedCount,
      likeRate: totalSwipes > 0 ? Math.round((likedCount / totalSwipes) * 100) : 0,
      lastSession: sessions?.[0] || null
    }
  }
}
