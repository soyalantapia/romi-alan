import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { subscribeTable } from '../lib/realtime'
import { useAuth } from './AuthContext'

const ConfigCtx = createContext(null)

export function ConfigProvider({ children }) {
  const { user } = useAuth()
  const [config, setConfigState] = useState({})

  useEffect(() => {
    if (!user) {
      setConfigState({})
      return
    }
    let active = true
    const load = async () => {
      try {
        const c = await api.getConfig()
        if (active) setConfigState(c || {})
      } catch {
        /* noop */
      }
    }
    load()
    const unsub = subscribeTable('config', load)
    return () => {
      active = false
      unsub()
    }
  }, [user])

  const set = async (clave, valor) => {
    setConfigState((c) => ({ ...c, [clave]: valor }))
    try {
      await api.setConfig(clave, valor)
    } catch {
      /* noop */
    }
  }
  const get = (clave, def = null) => (config[clave] != null ? config[clave] : def)

  return <ConfigCtx.Provider value={{ config, get, set }}>{children}</ConfigCtx.Provider>
}

export const useConfig = () => useContext(ConfigCtx)
