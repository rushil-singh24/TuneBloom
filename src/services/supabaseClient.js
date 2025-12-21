// Lightweight, safe-to-call Supabase service wrapper.
// Replace the no-op implementations with real Supabase client calls when available.

const noopPromise = (value) => Promise.resolve(value)

export const dbService = {
  async getExcludedTrackIds() {
    return []
  },
  async addBulkExcludedTracks(_userId, _trackIds, _reason = 'swiped') {
    return noopPromise(true)
  },
  async upsertUserPreferences(_userId, _payload) {
    return noopPromise(true)
  }
}
