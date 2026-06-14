import { WebSocketServer } from 'ws'
import { verifyToken } from './auth.js'

// Realtime simple y confiable: una instancia, broadcast en memoria a todos los
// sockets autenticados. Para 2 usuarios alcanza y sobra (sin LISTEN/NOTIFY).
let clients = new Set()

export function attachWss(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost')
    const token = url.searchParams.get('token')
    const payload = token && verifyToken(token)
    if (!payload) {
      ws.close(4001, 'No autorizado')
      return
    }
    ws.isAlive = true
    clients.add(ws)
    ws.on('pong', () => {
      ws.isAlive = true
    })
    ws.on('close', () => clients.delete(ws))
    ws.on('error', () => clients.delete(ws))
    try {
      ws.send(JSON.stringify({ type: 'hello' }))
    } catch {}
  })

  // Heartbeat: mantener vivas las conexiones detrás del proxy de Railway.
  const interval = setInterval(() => {
    for (const ws of clients) {
      if (ws.isAlive === false) {
        ws.terminate()
        clients.delete(ws)
        continue
      }
      ws.isAlive = false
      try {
        ws.ping()
      } catch {}
    }
  }, 30000)
  wss.on('close', () => clearInterval(interval))
}

export function broadcast(message) {
  const data = JSON.stringify(message)
  for (const ws of clients) {
    if (ws.readyState === 1 /* OPEN */) {
      try {
        ws.send(data)
      } catch {}
    }
  }
}
