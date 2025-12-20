import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCodeFromUrl, exchangeCodeForToken, setToken, verifyState, getToken } from "@/config/spotify"
import { spotifyApi } from "@/services/spotifyApi"

export default function Callback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const hasProcessed = useRef(false) // Prevent double execution in React StrictMode

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessed.current) {
      console.log('⚠️ Callback already processed, skipping...')
      return
    }
    
    const handleCallback = async () => {
      try {
        console.log('🔄 Callback handler started')
        console.log('📍 Current URL:', window.location.href)
        
        // Get code and state from URL query params (don't clear yet)
        const { code, state, error: urlError } = getCodeFromUrl(false)
        
        console.log('📥 Received from Spotify:', { 
          hasCode: !!code, 
          hasState: !!state, 
          error: urlError 
        })
        
        // If no code/state/error in URL, this might be first render (React StrictMode)
        // Wait a bit and check again, or redirect to login if nothing happens
        if (!code && !state && !urlError) {
          console.log('⚠️ No authorization data in URL - might be initial render')
          // Check if we're already logged in
          const existingToken = getToken()
          if (existingToken) {
            console.log('✅ Found existing token, redirecting to home')
            navigate('/', { replace: true })
            return
          }
          // Otherwise, wait a moment and check again (for React StrictMode double render)
          setTimeout(() => {
            const retry = getCodeFromUrl(false)
            if (!retry.code && !retry.state && !retry.error) {
              console.log('⚠️ Still no data, redirecting to login')
              navigate('/login', { replace: true })
            }
          }, 500)
          return
        }
        
        // Mark as processed before async operations
        hasProcessed.current = true
        
        // Check for error from Spotify
        if (urlError) {
          console.error('❌ Spotify authorization error:', urlError)
          setError(`Authorization failed: ${urlError}`)
          setTimeout(() => navigate('/login', { replace: true }), 3000)
          return
        }
        
        // Verify state (CSRF protection)
        if (!state) {
          console.error('❌ No state parameter received')
          setError('Security verification failed: No state parameter')
          setTimeout(() => navigate('/login', { replace: true }), 3000)
          return
        }
        
        if (!verifyState(state)) {
          console.error('❌ State mismatch - possible CSRF attack')
          console.error('Received state:', state)
          console.error('Stored state:', sessionStorage.getItem('spotify_state'))
          setError('Security verification failed. Please try again.')
          setTimeout(() => navigate('/login', { replace: true }), 3000)
          return
        }
        
        console.log('✅ State verified successfully')
        
        // Exchange code for token
        if (!code) {
          console.error('❌ No authorization code received')
          setError('No authorization code received. Please try logging in again.')
          setTimeout(() => navigate('/login', { replace: true }), 3000)
          return
        }
        
        console.log('🔄 Exchanging authorization code for token...')
        const tokenData = await exchangeCodeForToken(code)
        
        console.log('✅ Token exchange successful:', {
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        })
        
        // Store token
        const tokenStored = setToken(tokenData)
        if (!tokenStored) {
          throw new Error('Failed to store authentication token')
        }
        
        // Verify token is accessible before navigation
        const verifyToken = getToken()
        if (!verifyToken) {
          throw new Error('Token was stored but cannot be retrieved. Please try again.')
        }
        
        // Set token in spotifyApi immediately (before navigation)
        spotifyApi.setToken(verifyToken)
        console.log('✅ Token set in spotifyApi service')
        console.log('✅ Token verified and ready')
        
        // Clear URL params now that we've successfully processed them
        getCodeFromUrl(true)
        
        console.log('🚀 Redirecting to home page...')
        
        // Small delay to ensure everything is set before navigation
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Redirect to home page
        navigate('/', { replace: true })
      } catch (error) {
        console.error('❌ Callback error:', error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        })
        setError(error.message || 'Failed to complete login. Please try again.')
        setTimeout(() => navigate('/login', { replace: true }), 5000)
      }
    }
    
    handleCallback()
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {error ? (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <span className="text-red-400 text-2xl">✕</span>
          </div>
          <p className="text-red-400 text-lg mb-2">Error</p>
          <p className="text-white/60 text-sm text-center max-w-md">{error}</p>
          <p className="text-white/40 text-xs mt-4">Redirecting to login...</p>
        </>
      ) : (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4" />
          <p className="text-white/60 text-lg">Completing login...</p>
        </>
      )}
    </div>
  )
}