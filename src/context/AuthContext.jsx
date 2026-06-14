import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../lib/api'
import { startRealtime, stopRealtime } from '../lib/realtime'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const init = async () => {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const { perfil } = await api.me()
        if (active) {
          setUser(perfil)
          startRealtime()
        }
      } catch {
        setToken(null)
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    init()

    const onLogout = () => {
      setToken(null)
      setUser(null)
      stopRealtime()
    }
    window.addEventListener('auth:logout', onLogout)
    return () => {
      active = false
      window.removeEventListener('auth:logout', onLogout)
    }
  }, [])

  const signIn = async (creds) => {
    const { token, perfil } = await api.login(creds)
    setToken(token)
    setUser(perfil)
    startRealtime()
    return perfil
  }

  const signOut = async () => {
    setToken(null)
    setUser(null)
    stopRealtime()
  }

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
