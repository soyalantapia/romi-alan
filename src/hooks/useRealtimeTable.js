import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { subscribeTable } from '../lib/realtime'

let tempCounter = 0
const tempId = () => `temp-${Date.now()}-${tempCounter++}`

function upsert(rows, row) {
  const i = rows.findIndex((r) => r.id === row.id)
  if (i === -1) return [...rows, row]
  const next = rows.slice()
  next[i] = { ...next[i], ...row }
  return next
}

/**
 * Lee una tabla + se suscribe al realtime (WebSocket), con CRUD optimista.
 * Devuelve: { rows, loading, error, add, update, remove, refresh }
 * Las pantallas ordenan/filtran `rows` a gusto.
 */
export function useRealtimeTable(table) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.list(table)
      if (mounted.current) setRows(data || [])
    } catch (e) {
      if (mounted.current) setError(e)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [table])

  useEffect(() => {
    mounted.current = true
    setLoading(true)
    refresh()
    const unsub = subscribeTable(table, (msg) => {
      if (!mounted.current) return
      setRows((prev) =>
        msg.type === 'DELETE'
          ? prev.filter((r) => r.id !== msg.row.id)
          : upsert(prev, msg.row)
      )
    })
    return () => {
      mounted.current = false
      unsub()
    }
  }, [table, refresh])

  const add = useCallback(
    async (payload) => {
      const optimistic = {
        id: tempId(),
        created_at: new Date().toISOString(),
        ...payload,
        _pending: true,
      }
      setRows((prev) => [...prev, optimistic])
      try {
        const row = await api.insert(table, payload)
        setRows((prev) => upsert(prev.filter((r) => r.id !== optimistic.id), row))
        return { data: row }
      } catch (e) {
        setRows((prev) => prev.filter((r) => r.id !== optimistic.id))
        setError(e)
        return { error: e }
      }
    },
    [table]
  )

  const update = useCallback(
    async (id, patch) => {
      let prevRow
      setRows((prev) => {
        prevRow = prev.find((r) => r.id === id)
        return prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      })
      try {
        const row = await api.update(table, id, patch)
        setRows((prev) => upsert(prev, row))
        return { data: row }
      } catch (e) {
        // rollback sólo de la fila afectada (no pisar echos de realtime en vuelo)
        if (prevRow) setRows((prev) => prev.map((r) => (r.id === id ? prevRow : r)))
        setError(e)
        return { error: e }
      }
    },
    [table]
  )

  const remove = useCallback(
    async (id) => {
      let removed
      setRows((prev) => {
        removed = prev.find((r) => r.id === id)
        return prev.filter((r) => r.id !== id)
      })
      try {
        await api.remove(table, id)
        return {}
      } catch (e) {
        // reinsertar sólo la fila borrada (no pisar echos de realtime en vuelo)
        if (removed) setRows((prev) => upsert(prev, removed))
        setError(e)
        return { error: e }
      }
    },
    [table]
  )

  return { rows, loading, error, add, update, remove, refresh }
}
