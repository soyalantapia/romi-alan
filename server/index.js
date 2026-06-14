import express from 'express'
import compression from 'compression'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { mountApi } from './api.js'
import { attachWss } from './realtime.js'
import { pool } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '../dist')
const PORT = process.env.PORT || 3001

const app = express()
app.disable('x-powered-by')
app.use(compression())
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1')
    res.json({ ok: true })
  } catch {
    res.status(500).json({ ok: false })
  }
})

mountApi(app)

// 404 explícito para rutas /api desconocidas (no caer al index.html)
app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontrado' }))

// ── Frontend estático + fallback SPA ──
if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('*', (_req, res) => res.sendFile(join(DIST, 'index.html')))
} else {
  app.get('*', (_req, res) =>
    res
      .status(200)
      .send('Backend de Romi & Alan andando. Build del frontend pendiente (npm run build).')
  )
}

const server = http.createServer(app)
attachWss(server)

server.listen(PORT, () => {
  console.log(`♥ Romi & Alan — servidor en puerto ${PORT}`)
})
