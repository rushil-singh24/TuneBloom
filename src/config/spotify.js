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
  
  // Store code verifier in sessionStorage
  sessionStorage.setItem('spotify_code_verifier', codeVerifier)
  
  return { codeVerifier, codeChallenge }
}

// Generate state for CSRF protection
export const generateState = () => {
  const state = generateRandomString(16)
  sessionStorage.setItem('spotify_state', state)
  return state
}

// Automatically detect environment and set redirect URI
const getRedirectUri = () => {
  // If explicitly set in env, use that
  if (import.meta.env.VITE_REDIRECT_URI) {
    return import.meta.env.VITE_REDIRECT_URI
  }
  
  // Auto-detect based on environment
  if (import.meta.env.PROD) {
    // Production: use the deployed URL (you'll set this in your deployment platform)
    return import.meta.env.VITE_APP_URL 
      ? `${import.meta.env.VITE_APP_URL}/callback`
      : window.location.origin + '/callback'
  } else {
    // Development: use 127.0.0.1 (Spotify requires explicit IP, not localhost)
    return 'http://127.0.0.1:5173/callback'
  }
}

export const spotifyConfig = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
  redirectUri: getRedirectUri(),
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

// Debug: Log config on load (only in dev)
if (import.meta.env.DEV) {
  console.log('🎵 Spotify Config Loaded:', {
    clientId: spotifyConfig.clientId ? `${spotifyConfig.clientId.substring(0, 10)}...` : 'MISSING',
    redirectUri: spotifyConfig.redirectUri,
    envClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID ? 'LOADED' : 'NOT LOADED',
    envRedirectUri: import.meta.env.VITE_REDIRECT_URI || 'NOT SET (using default)'
  })
}

// Generate Spotify authorization URL (Authorization Code Flow with PKCE)
export const getAuthUrl = async () => {
  const { clientId, redirectUri, authEndpoint, scopes } = spotifyConfig

  // Validate client ID
  if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
    console.error('❌ Spotify Client ID is missing!')
    console.error('Please create a .env file with VITE_SPOTIFY_CLIENT_ID=your_client_id')
    alert('Spotify Client ID is not configured. Please check your .env file and restart the dev server.')
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
    show_dialog: 'true' // Force user to approve even if previously authorized
  })

  // Debug logging (remove in production)
  if (import.meta.env.DEV) {
    console.log('🔍 Spotify OAuth Debug (Authorization Code Flow):', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
      redirectUri,
      hasClientId: !!clientId && clientId !== 'YOUR_CLIENT_ID_HERE',
      flow: 'Authorization Code Flow with PKCE'
    })
    console.log('🔗 Full Auth URL:', `${authEndpoint}?${params.toString()}`)
    console.log('✅ Make sure this EXACT redirect URI is in Spotify dashboard:', redirectUri)
  }

  return `${authEndpoint}?${params.toString()}`
}

// Extract authorization code and state from URL query params (Authorization Code Flow)
export const getCodeFromUrl = (clearParams = false) => {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')
    
    // Only clear query params if requested (after successful processing)
    if (clearParams) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    return { code, state, error }
  } catch {
    return { code: null, state: null, error: null }
  }
}

// Exchange authorization code for access token (Authorization Code Flow with PKCE)
export const exchangeCodeForToken = async (code) => {
  const { clientId, redirectUri } = spotifyConfig
  const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
  
  console.log('🔑 Token exchange request:', {
    hasCode: !!code,
    hasCodeVerifier: !!codeVerifier,
    redirectUri,
    clientId: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING'
  })
  
  if (!codeVerifier) {
    console.error('❌ Code verifier not found in sessionStorage')
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
    
    console.log('📤 Sending token exchange request...')
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    })

    const responseText = await response.text()
    console.log('📥 Token exchange response status:', response.status)
    console.log('📥 Token exchange response:', responseText.substring(0, 200))

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
    
    console.log('✅ Token exchange successful:', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type
    })
    
    // Clean up PKCE verifier
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
    console.error('❌ setToken called with invalid tokenData:', tokenData)
    return false
  }
  
  const expiry = Date.now() + (tokenData.expires_in * 1000) // Convert seconds to milliseconds
  try {
    sessionStorage.setItem('spotify_token', tokenData.access_token)
    sessionStorage.setItem('spotify_token_expiry', expiry.toString())
    if (tokenData.refresh_token) {
      sessionStorage.setItem('spotify_refresh_token', tokenData.refresh_token)
    }
    
    // Verify token was stored
    const storedToken = sessionStorage.getItem('spotify_token')
    if (storedToken === tokenData.access_token) {
      console.log('✅ Token stored successfully and verified')
      return true
    } else {
      console.error('❌ Token storage verification failed')
      return false
    }
  } catch (error) {
    console.error('❌ Unable to store Spotify token in sessionStorage:', error)
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
