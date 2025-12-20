import React from 'react'
import { motion } from 'framer-motion'
import { Music2, Sparkles, TrendingUp, Heart } from 'lucide-react'
import { getAuthUrl } from "@/config/spotify"

export default function Login() {
  const handleLogin = async () => {
    console.log('🔘 Login button clicked')
    
    // Clear any existing tokens/session data to force fresh login
    try {
      sessionStorage.removeItem('spotify_token')
      sessionStorage.removeItem('spotify_token_expiry')
      sessionStorage.removeItem('spotify_refresh_token')
      sessionStorage.removeItem('spotify_code_verifier')
      sessionStorage.removeItem('spotify_state')
      console.log('🧹 Cleared existing session data')
    } catch (e) {
      console.warn('Could not clear session:', e)
    }
    
    try {
      const authUrl = await getAuthUrl()
      console.log('🔗 Auth URL generated:', authUrl ? 'YES' : 'NO')
      
      if (!authUrl) {
        console.error('❌ getAuthUrl returned null - check console for details')
        // Error already logged/alerted in getAuthUrl
        return
      }
      
      console.log('🚀 Redirecting to Spotify authorization...')
      window.location.href = authUrl
    } catch (error) {
      console.error('❌ Error in handleLogin:', error)
      alert('Error starting login: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a0a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -80, 0],
            y: [0, -60, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-500/30 to-pink-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="max-w-lg w-full relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/50">
              <Sparkles className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>
          
          <h1 className="text-7xl font-black mb-3 bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent leading-tight">
            TuneBloom
          </h1>
          <p className="text-xl text-white/70 font-medium">
            Discover Your Next Favorite Song
          </p>
        </motion.div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full mb-10"
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Music2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Personalized Discovery</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Get music recommendations tailored to your unique Spotify listening history
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Swipe & Save</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Like songs to add them to your temporary playlist instantly
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Track Your Taste</h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    See analytics and insights about your music preferences over time
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Login Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="w-full"
        >
          <button
            onClick={handleLogin}
            className="w-full py-5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-green-500/50 flex items-center justify-center gap-3 group"
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" 
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span>Continue with Spotify</span>
          </button>
          
          <p className="text-center text-white/50 text-xs mt-4 font-medium">
            By continuing, you agree to let TuneBloom access your Spotify data
          </p>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-0">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-32 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent rounded-full"
        />
      </div>
    </div>
  )
}