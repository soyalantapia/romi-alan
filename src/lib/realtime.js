// WebSocket singleton: lo que carga una persona aparece en la otra al instante.
// Reconecta solo. Cada pantalla se suscribe a su tabla.
import { getToken } from './api'

const subscribers = new Map() // tabla -> Set<callback>
let ws = null
let reconnectTimer = null
let shouldRun = false

function wsUrl() {
  const token = getToken() || ''
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws?token=${encodeURIComponent(token)}`
}

function connect() {
  if (!shouldRun || ws || !getToken()) return
  try {
    ws = new WebSocket(wsUrl())
  } catch {
    scheduleReconnect()
    return
  }
  ws.onmessage = (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (!msg.table) return
    const subs = subscribers.get(msg.table)
    if (subs) subs.forEach((cb) => cb(msg))
  }
  ws.onclose = () => {
    ws = null
    scheduleReconnect()
  }
  ws.onerror = () => {
    try {
      ws && ws.close()
    } catch {}
  }
}

function scheduleReconnect() {
  if (!shouldRun) return
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(connect, 2000)
}

export function startRealtime() {
  shouldRun = true
  if (!ws) connect()
}

export function stopRealtime() {
  shouldRun = false
  clearTimeout(reconnectTimer)
  if (ws) {
    try {
      ws.close()
    } catch {}
    ws = null
  }
}

export function subscribeTable(table, cb) {
  if (!subscribers.has(table)) subscribers.set(table, new Set())
  subscribers.get(table).add(cb)
  // por si el socket todavía no arrancó
  startRealtime()
  return () => {
    const s = subscribers.get(table)
    if (s) {
      s.delete(cb)
      if (!s.size) subscribers.delete(table)
    }
  }
}
