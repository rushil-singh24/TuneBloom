import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTokenFromUrl, setToken } from "@/config/spotify"

export default function Callback() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = getTokenFromUrl()
    
    if (token) {
      setToken(token)
      // Redirect to home page
      navigate('/', { replace: true })
    } else {
      // No token found, redirect to login
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4" />
      <p className="text-white/60 text-lg">Completing login...</p>
    </div>
  )
}