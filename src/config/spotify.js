// Spotify OAuth Configuration
// You need to create a Spotify app at https://developer.spotify.com/dashboard

export const spotifyConfig = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback',
  authEndpoint: 'https://accounts.spotify.com/authorize',

  // Scopes define what your app can access
  scopes: [
    'user-read-private',           
    'user-read-email',             
    'user-top-read',               
    'user-read-recently-played',   
    'playlist-read-private',       
    'playlist-modify-public',      
    'playlist-modify-private',     
    'user-library-read',           
    'user-library-modify',         
  ]
}

// Generate Spotify authorization URL
export const getAuthUrl = () => {
  const { clientId, redirectUri, authEndpoint, scopes } = spotifyConfig

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    response_type: 'token',
    show_dialog: 'true'
  })

  return `${authEndpoint}?${params.toString()}`
}

// Extract token from URL hash (after redirect)
export const getTokenFromUrl = () => {
  try {
    const hash = window.location.hash
      .substring(1)
      .split('&')
      .reduce((acc, item) => {
        const parts = item.split('=')
        if (parts.length === 2) acc[parts[0]] = decodeURIComponent(parts[1])
        return acc
      }, {})

    window.location.hash = '' // Clear hash from URL
    return hash.access_token || null
  } catch {
    return null
  }
}

// Store token with expiry (tokens last 1 hour)
export const setToken = (token) => {
  if (!token) return
  const expiry = Date.now() + 3600000 // 1 hour
  try {
    sessionStorage.setItem('spotify_token', token)
    sessionStorage.setItem('spotify_token_expiry', expiry.toString())
  } catch {
    console.warn('Unable to store Spotify token in sessionStorage')
  }
}

// Get stored token if still valid
export const getToken = () => {
  try {
    const token = sessionStorage.getItem('spotify_token')
    const expiry = sessionStorage.getItem('spotify_token_expiry')

    if (!token || !expiry) return null
    if (Date.now() > parseInt(expiry, 10)) {
      clearToken()
      return null
    }

    return token
  } catch {
    return null
  }
}

// Clear stored token
export const clearToken = () => {
  try {
    sessionStorage.removeItem('spotify_token')
    sessionStorage.removeItem('spotify_token_expiry')
  } catch {}
}
