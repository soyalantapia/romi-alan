import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { subscribeTable } from '../lib/realtime'
import { useAuth } from './AuthContext'

const ProfilesCtx = createContext(null)

// "#CE8A99" → "206 138 153" (canales para variables CSS)
function hexToChannels(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return null
  return `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`
}

// El corazón de la marca toma los colores reales de la pareja.
function applyBrandColors(profiles) {
  if (!profiles?.length) return
  const romi = profiles.find((p) => /^rom/i.test(p.nombre || '')) || profiles[0]
  const alan = profiles.find((p) => p.id !== romi?.id) || profiles[1] || profiles[0]
  const cr = hexToChannels(romi?.color)
  const ca = hexToChannels(alan?.color)
  if (cr) document.documentElement.style.setProperty('--c-romi', cr)
  if (ca) document.documentElement.style.setProperty('--c-alan', ca)
}

export function ProfilesProvider({ children }) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfiles([])
      setLoading(false)
      return
    }
    let active = true
    const load = async () => {
      try {
        const data = await api.perfiles()
        if (!active) return
        setProfiles(data || [])
        applyBrandColors(data)
      } catch {
        /* noop */
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const unsub = subscribeTable('perfiles', load)
    return () => {
      active = false
      unsub()
    }
  }, [user])

  const byId = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles]
  )
  const me = user ? byId[user.id] || user : null
  const other = profiles.find((p) => p.id !== user?.id) || null

  const updateProfile = async (patch) => {
    if (!me) return { error: new Error('sin perfil') }
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === me.id ? { ...p, ...patch } : p))
      applyBrandColors(next)
      return next
    })
    try {
      const row = await api.updateProfile(patch)
      setProfiles((prev) => prev.map((p) => (p.id === row.id ? { ...p, ...row } : p)))
      return { data: row }
    } catch (e) {
      return { error: e }
    }
  }

  const value = {
    profiles,
    byId,
    me,
    other,
    loading,
    updateProfile,
    profileFor: (id) => byId[id] || null,
  }
  return <ProfilesCtx.Provider value={value}>{children}</ProfilesCtx.Provider>
}

export const useProfiles = () => useContext(ProfilesCtx)
