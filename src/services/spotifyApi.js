// Spotify API Service
// Handles all API calls to Spotify Web API

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

class SpotifyAPI {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error("No access token set");
    }

    const url = `${SPOTIFY_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getCurrentUser() {
    return this.request("/me");
  }

  async getTopTracks(timeRange = "medium_term", limit = 50) {
    return this.request(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
  }

  async getTopArtists(timeRange = "medium_term", limit = 20) {
    return this.request(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
  }

  async getAudioFeatures(trackIds) {
    const ids = trackIds.join(",");
    return this.request(`/audio-features?ids=${ids}`);
  }

  async getRecommendations(params) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/recommendations?${queryParams}`);
  }

  async searchTracks(query, limit = 20) {
    const encodedQuery = encodeURIComponent(query);
    return this.request(`/search?q=${encodedQuery}&type=track&limit=${limit}`);
  }

  async getUserPlaylists(limit = 50) {
    return this.request(`/me/playlists?limit=${limit}`);
  }

  async createPlaylist(userId, name, description = "", isPublic = true) {
    return this.request(`/users/${userId}/playlists`, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    });
  }

  async addTracksToPlaylist(playlistId, trackUris) {
    return this.request(`/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({
        uris: trackUris,
      }),
    });
  }

  async getSavedTracks(limit = 50, offset = 0) {
    return this.request(`/me/tracks?limit=${limit}&offset=${offset}`);
  }

  async saveTracks(trackIds) {
    return this.request("/me/tracks", {
      method: "PUT",
      body: JSON.stringify({
        ids: trackIds,
      }),
    });
  }

  async getTrack(trackId) {
    return this.request(`/tracks/${trackId}`);
  }

  async getTracks(trackIds) {
    const ids = trackIds.join(",");
    return this.request(`/tracks?ids=${ids}`);
  }

  async getRecentlyPlayed(limit = 50) {
    return this.request(`/me/player/recently-played?limit=${limit}`);
  }
}

export const spotifyApi = new SpotifyAPI();
