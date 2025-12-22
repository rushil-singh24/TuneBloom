// Spotify OAuth Configuration
// Using Authorization Code Flow with PKCE (no client secret needed)

// PKCE Helper Functions
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return await crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

// Generate PKCE code verifier and challenge
export const generatePKCE = async () => {
  const codeVerifier = generateRandomString(128)
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed)
  
  sessionStorage.setItem('spotify_code_verifier', codeVerifier)
  
  return { codeVerifier, codeChallenge }
}

// Generate state for CSRF protection
export const generateState = () => {
  const state = generateRandomString(16)
  sessionStorage.setItem('spotify_state', state)
  return state
}

const resolveRedirectUri = () => {
  // Prefer explicit env; otherwise derive from current origin to avoid localhost fallback in production
  if (import.meta.env.VITE_REDIRECT_URI) return import.meta.env.VITE_REDIRECT_URI
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/callback`
  }
  return 'http://127.0.0.1:5173/callback'
}

export const spotifyConfig = {
  // Try to read from .env, but fallback to derived origin (not hardcoded localhost in prod)
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '6fe7b7e4dddb40ff95bb6f6df02e6e3d',
  redirectUri: resolveRedirectUri(),
  authEndpoint: 'https://accounts.spotify.com/authorize',

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

// Debug: Log config on load
console.log('🎵 Spotify Config Loaded:', {
  clientId: spotifyConfig.clientId ? `${spotifyConfig.clientId.substring(0, 10)}...` : 'MISSING',
  redirectUri: spotifyConfig.redirectUri,
  source: import.meta.env.VITE_SPOTIFY_CLIENT_ID ? 'from .env' : 'hardcoded fallback',
  hasValidClientId: spotifyConfig.clientId && spotifyConfig.clientId.length > 20
})

// Generate Spotify authorization URL
export const getAuthUrl = async () => {
  const { clientId, redirectUri, authEndpoint, scopes } = spotifyConfig

  // Validate client ID
  if (!clientId || clientId.length < 20) {
    console.error('❌ Spotify Client ID is invalid!')
    alert('Spotify Client ID is not configured correctly.')
    return null
  }

  // Generate PKCE code challenge
  const { codeChallenge } = await generatePKCE()
  
  // Generate state for CSRF protection
  const state = generateState()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes.join(' '),
    redirect_uri: redirectUri,
    state: state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: 'true'
  })

  console.log('🔗 Auth URL generated with Client ID:', clientId.substring(0, 10) + '...')

  return `${authEndpoint}?${params.toString()}`
}

// Extract authorization code from URL
export const getCodeFromUrl = (clearParams = false) => {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')
    
    if (clearParams) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    return { code, state, error }
  } catch {
    return { code: null, state: null, error: null }
  }
}

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code) => {
  const { clientId, redirectUri } = spotifyConfig
  const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
  
  console.log('🔑 Token exchange with Client ID:', clientId.substring(0, 10) + '...')
  
  if (!codeVerifier) {
    console.error('❌ Code verifier not found')
    throw new Error('Code verifier not found. Please try logging in again.')
  }

  try {
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier
    })
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    })

    const responseText = await response.text()

    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { error: 'Unknown error', error_description: responseText }
      }
      console.error('❌ Token exchange failed:', errorData)
      throw new Error(errorData.error_description || errorData.error || `HTTP ${response.status}`)
    }

    const data = JSON.parse(responseText)
    
    console.log('✅ Token exchange successful')
    
    sessionStorage.removeItem('spotify_code_verifier')
    
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type
    }
  } catch (error) {
    console.error('❌ Token exchange error:', error)
    throw error
  }
}

// Store token with expiry
export const setToken = (tokenData) => {
  if (!tokenData || !tokenData.access_token) {
    console.error('❌ setToken called with invalid tokenData')
    return false
  }
  
  const expiry = Date.now() + (tokenData.expires_in * 1000)
  try {
    sessionStorage.setItem('spotify_token', tokenData.access_token)
    sessionStorage.setItem('spotify_token_expiry', expiry.toString())
    if (tokenData.refresh_token) {
      sessionStorage.setItem('spotify_refresh_token', tokenData.refresh_token)
    }
    
    console.log('✅ Token stored successfully')
    return true
  } catch (error) {
    console.error('❌ Unable to store token:', error)
    return false
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

// Verify state matches (CSRF protection)
export const verifyState = (receivedState) => {
  const storedState = sessionStorage.getItem('spotify_state')
  sessionStorage.removeItem('spotify_state')
  return storedState === receivedState
}

// Clear stored token
export const clearToken = () => {
  try {
    sessionStorage.removeItem('spotify_token')
    sessionStorage.removeItem('spotify_token_expiry')
    sessionStorage.removeItem('spotify_refresh_token')
    sessionStorage.removeItem('spotify_code_verifier')
    sessionStorage.removeItem('spotify_state')
  } catch {}
}
