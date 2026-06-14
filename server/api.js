import { query } from './db.js'
import { requireAuth, verifyPassword, signToken } from './auth.js'
import { broadcast } from './realtime.js'

// Columnas permitidas por tabla (whitelist → seguro para interpolar el nombre).
// El autor lo fija SIEMPRE el servidor (no se confía en el cliente).
const TABLES = {
  temas: {
    author: 'creado_por',
    insert: ['titulo', 'detalle', 'prioridad', 'estado'],
    update: ['titulo', 'detalle', 'prioridad', 'estado'],
  },
  compras: {
    author: 'creado_por',
    insert: ['nombre', 'cantidad', 'categoria', 'comprado'],
    update: ['nombre', 'cantidad', 'categoria', 'comprado'],
  },
  movimientos: {
    author: 'registrado_por',
    // "quién puso la plata" es editable (default el usuario actual)
    allowAuthorOverride: true,
    insert: ['tipo', 'monto', 'concepto', 'categoria', 'fecha'],
    update: ['tipo', 'monto', 'concepto', 'categoria', 'fecha', 'registrado_por'],
  },
  planes: {
    author: 'creado_por',
    insert: ['titulo', 'detalle', 'categoria', 'fecha', 'recordar', 'dias_antes', 'estado'],
    update: ['titulo', 'detalle', 'categoria', 'fecha', 'recordar', 'dias_antes', 'estado'],
  },
}

const publicPerfil = (p) => ({ id: p.id, nombre: p.nombre, color: p.color, email: p.email })
const str = (v) => typeof v === 'string' && v.trim().length > 0

function tableGuard(req, res, next) {
  const t = req.params.table
  if (!TABLES[t]) return res.status(404).json({ error: 'Recurso desconocido' })
  req.table = t
  next()
}

function validateInsert(table, b = {}) {
  if (table === 'temas' && !str(b.titulo)) return 'El tema necesita un título'
  if (table === 'compras' && !str(b.nombre)) return 'La compra necesita un nombre'
  if (table === 'planes' && !str(b.titulo)) return 'El plan necesita un título'
  if (table === 'movimientos') {
    if (!['aporte', 'gasto'].includes(b.tipo)) return 'Elegí aporte o gasto'
    if (!(Number(b.monto) > 0)) return 'El monto tiene que ser mayor a 0'
  }
  return null
}

function dbError(e) {
  if (e?.code === '23514') return 'Algún dato no es válido'
  if (e?.code === '23503') return 'Falta el perfil de quién lo carga'
  return 'No se pudo guardar'
}

async function handleInsert(table, body, cfg, userId) {
  const authorVal = cfg.allowAuthorOverride && body[cfg.author] ? body[cfg.author] : userId
  const cols = [cfg.author]
  const vals = [authorVal]
  for (const k of cfg.insert) {
    if (k in body && body[k] !== undefined && body[k] !== '') {
      cols.push(k)
      vals.push(body[k])
    }
  }
  const names = cols.join(', ')
  const ph = cols.map((_, i) => `$${i + 1}`).join(', ')
  const { rows } = await query(
    `insert into ${table} (${names}) values (${ph}) returning *`,
    vals
  )
  return rows[0]
}

async function handleUpdate(table, id, patch, cfg) {
  const cols = []
  const vals = []
  for (const k of cfg.update) {
    if (k in patch) {
      cols.push(k)
      vals.push(patch[k] === '' ? null : patch[k])
    }
  }
  // Timestamps que maneja el servidor según el cambio de estado.
  const raw = []
  if (table === 'temas') {
    raw.push('updated_at = now()')
    if ('estado' in patch) raw.push(`hablado_at = ${patch.estado === 'hablado' ? 'now()' : 'null'}`)
  }
  if (table === 'compras' && 'comprado' in patch) {
    raw.push(`comprado_at = ${patch.comprado ? 'now()' : 'null'}`)
  }
  if (table === 'planes' && 'estado' in patch) {
    raw.push(`hecho_at = ${patch.estado === 'hecho' ? 'now()' : 'null'}`)
  }
  if (!cols.length && !raw.length) return null
  const setParam = cols.map((c, i) => `${c} = $${i + 1}`)
  const setClause = [...setParam, ...raw].join(', ')
  const { rows } = await query(
    `update ${table} set ${setClause} where id = $${cols.length + 1} returning *`,
    [...vals, id]
  )
  return rows[0] || null
}

export function mountApi(app) {
  // ── ¿Quién sos? (público) — sólo nombre + color, para el selector del login ──
  app.get('/api/quienes', async (_req, res) => {
    try {
      const { rows } = await query('select id, nombre, color from perfiles order by created_at')
      res.json(rows)
    } catch {
      res.json([])
    }
  })

  // ── Auth: login por persona (id) o por email ──
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, id, password } = req.body || {}
      if (!password || (!email && !id)) return res.status(400).json({ error: 'Faltan datos' })
      let rows
      if (id) {
        if (!UUID.test(String(id))) return res.status(401).json({ error: 'No pudimos entrar' })
        ;({ rows } = await query('select * from perfiles where id = $1', [id]))
      } else {
        ;({ rows } = await query('select * from perfiles where lower(email) = lower($1)', [
          String(email).trim(),
        ]))
      }
      const perfil = rows[0]
      const ok = perfil && (await verifyPassword(password, perfil.password_hash))
      if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' })
      res.json({ token: signToken(perfil), perfil: publicPerfil(perfil) })
    } catch (e) {
      res.status(500).json({ error: 'Error de servidor' })
    }
  })

  app.get('/api/me', requireAuth, async (req, res) => {
    const { rows } = await query('select * from perfiles where id = $1', [req.user.sub])
    if (!rows[0]) return res.status(401).json({ error: 'No autorizado' })
    res.json({ perfil: publicPerfil(rows[0]) })
  })

  // ── Perfiles (los dos, sin datos sensibles) ──
  app.get('/api/perfiles', requireAuth, async (_req, res) => {
    const { rows } = await query(
      'select id, nombre, color, created_at from perfiles order by created_at'
    )
    res.json(rows)
  })

  app.patch('/api/perfiles/me', requireAuth, async (req, res) => {
    const { nombre, color } = req.body || {}
    const cols = []
    const vals = []
    if (str(nombre)) {
      cols.push('nombre')
      vals.push(nombre.trim())
    }
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) {
      cols.push('color')
      vals.push(color)
    }
    if (!cols.length) return res.status(400).json({ error: 'Nada para actualizar' })
    const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ')
    const { rows } = await query(
      `update perfiles set ${setClause} where id = $${cols.length + 1} returning id, nombre, color, created_at`,
      [...vals, req.user.sub]
    )
    broadcast({ table: 'perfiles', type: 'UPDATE', row: rows[0] })
    res.json(rows[0])
  })

  // ── CRUD genérico por tabla ──
  app.get('/api/:table', requireAuth, tableGuard, async (req, res) => {
    const { rows } = await query(`select * from ${req.table}`)
    res.json(rows)
  })

  app.post('/api/:table', requireAuth, tableGuard, async (req, res) => {
    try {
      const err = validateInsert(req.table, req.body || {})
      if (err) return res.status(400).json({ error: err })
      const row = await handleInsert(req.table, req.body || {}, TABLES[req.table], req.user.sub)
      broadcast({ table: req.table, type: 'INSERT', row })
      res.status(201).json(row)
    } catch (e) {
      res.status(400).json({ error: dbError(e) })
    }
  })

  app.patch('/api/:table/:id', requireAuth, tableGuard, async (req, res) => {
    try {
      const row = await handleUpdate(req.table, req.params.id, req.body || {}, TABLES[req.table])
      if (!row) return res.status(404).json({ error: 'No encontrado' })
      broadcast({ table: req.table, type: 'UPDATE', row })
      res.json(row)
    } catch (e) {
      res.status(400).json({ error: dbError(e) })
    }
  })

  app.delete('/api/:table/:id', requireAuth, tableGuard, async (req, res) => {
    await query(`delete from ${req.table} where id = $1`, [req.params.id])
    broadcast({ table: req.table, type: 'DELETE', row: { id: req.params.id } })
    res.status(204).end()
  })
}
