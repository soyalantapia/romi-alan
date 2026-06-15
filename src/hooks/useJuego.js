import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { subscribeTable } from '../lib/realtime'

// Estado del juego de preguntas + acciones. Se refresca solo por realtime
// (señal 'juego') cuando el otro responde/saltea.
export function useJuego() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  const reload = useCallback(async () => {
    try {
      const d = await api.getJuego()
      if (mounted.current) setData(d)
    } catch {
      /* noop */
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    reload()
    const unsub = subscribeTable('juego', reload)
    return () => {
      mounted.current = false
      unsub()
    }
  }, [reload])

  const marcar = async (id, persona, respondio) => {
    await api.marcar(id, persona, respondio)
    reload()
  }
  const siguiente = async () => {
    await api.siguiente()
    reload()
  }
  const reactivar = async (id) => {
    await api.reactivar(id)
    reload()
  }

  return { data, loading, reload, marcar, siguiente, reactivar }
}
