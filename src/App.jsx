import React, { useEffect } from "react"
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"
import { getToken } from "./config/spotify"
import { spotifyApi } from "./services/spotifyApi"
import BottomNav from "./components/shared/BottomNav"
import Login from "./pages/Login"
import Callback from "./pages/Callback"
import Home from "./pages/Home"
import Favorites from "./pages/Favorites"
import Analytics from "./pages/Analytics"
import Profile from "./pages/Profile"

function ProtectedRoute({ children }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = getToken()

  useEffect(() => {
    const publicRoutes = ["/login", "/callback"]
    if (!token && !publicRoutes.includes(location.pathname)) {
      navigate("/login", { replace: true })
    }
  }, [token, location.pathname, navigate])

  useEffect(() => {
    if (token && spotifyApi?.setToken) {
      spotifyApi.setToken(token)
    }
  }, [token])

  const hideBottomNav = ["/login", "/callback"].includes(location.pathname)

  return (
    <div className={`min-h-screen text-white ${location.pathname === '/login' ? '' : 'bg-[#0a0a0a]'}`}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {!hideBottomNav && token && <BottomNav />}
    </div>
  )
}
