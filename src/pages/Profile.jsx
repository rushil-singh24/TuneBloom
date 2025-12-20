import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { LogOut, ExternalLink, Music2, User as UserIcon, Mail } from 'lucide-react'
import { spotifyApi } from '@/services/spotifyApi'
import { clearToken } from '@/config/spotify'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const navigate = useNavigate()

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => spotifyApi.getCurrentUser()
  })

  const handleLogout = () => {
    clearToken()
    navigate('/login', { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
      </div>
    )
  }

  const profileImage = user?.images?.[0]?.url

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="pt-8 pb-6 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            {/* Profile Picture */}
            <div className="relative inline-block mb-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user?.display_name}
                  className="w-24 h-24 rounded-full border-4 border-green-500/50 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center border-4 border-green-500/50 shadow-xl">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                <Music2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* User Info */}
            <h1 className="text-2xl font-bold text-white mb-1">
              {user?.display_name || 'Music Lover'}
            </h1>
            {user?.email && (
              <p className="text-white/60 text-sm flex items-center justify-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
            )}
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
              <p className="text-3xl font-bold text-green-400 mb-1">
                {user?.followers?.total || 0}
              </p>
              <p className="text-white/60 text-sm">Followers</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
              <p className="text-3xl font-bold text-white mb-1">
                {user?.product || 'Free'}
              </p>
              <p className="text-white/60 text-sm capitalize">Plan</p>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {/* Spotify Profile */}
            {user?.external_urls?.spotify && (
              <a
                href={user.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">View on Spotify</p>
                    <p className="text-white/60 text-xs">Open your profile</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
              </a>
            )}

            {/* Settings placeholder */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3">About TuneBloom</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                TuneBloom analyzes your Spotify listening history to recommend new tracks 
                perfectly matched to your taste. Swipe through personalized recommendations 
                and build your perfect playlist.
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-2xl p-4 border border-red-500/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8 text-white/40 text-xs"
          >
            <p>TuneBloom v1.0.0</p>
            <p className="mt-1">Made with ♥ for music lovers</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}