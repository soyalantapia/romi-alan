import { query, pool } from './db.js'
import { requireAuth, verifyToken, verifyPassword, signToken } from './auth.js'
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
  // ── Addendum ──
  puntos_trabajar: {
    author: 'creado_por',
    insert: ['encuentro_id', 'texto', 'tipo', 'estado'],
    update: ['texto', 'tipo', 'estado'],
  },
  momentos: {
    author: 'creado_por',
    insert: ['encuentro_id', 'texto', 'tipo'],
    update: ['texto', 'tipo'],
  },
  encuentros: {
    author: null, // encuentro compartido, sin autor
    insert: ['fecha', 'titulo', 'acuerdos', 'estado'],
    update: ['fecha', 'titulo', 'acuerdos', 'estado'],
  },
  pulso: {
    author: 'registrado_por',
    insert: ['pilar', 'nivel', 'nota'],
    update: ['pilar', 'nivel', 'nota'],
  },
  metas: {
    author: 'creado_por',
    insert: ['nombre', 'objetivo', 'acumulado', 'estado'],
    update: ['nombre', 'objetivo', 'acumulado', 'estado'],
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
  if (table === 'puntos_trabajar' && !str(b.texto)) return 'Escribí en qué querés trabajar'
  if (table === 'momentos' && !str(b.texto)) return 'Escribí algo lindo'
  if (table === 'pulso') {
    if (!['amor', 'relacion', 'pasion'].includes(b.pilar)) return 'Pilar inválido'
    if (!['pleno', 'bien', 'necesita_carino'].includes(b.nivel)) return 'Nivel inválido'
  }
  if (table === 'metas') {
    if (!str(b.nombre)) return 'La meta necesita un nombre'
    if (!(Number(b.objetivo) > 0)) return 'El objetivo tiene que ser mayor a 0'
  }
  return null
}

function dbError(e) {
  if (e?.code === '23514') return 'Algún dato no es válido'
  if (e?.code === '23503') return 'Falta el perfil de quién lo carga'
  return 'No se pudo guardar'
}

async function handleInsert(table, body, cfg, userId) {
  const cols = []
  const vals = []
  if (cfg.author) {
    cols.push(cfg.author)
    vals.push(cfg.allowAuthorOverride && body[cfg.author] ? body[cfg.author] : userId)
  }
  for (const k of cfg.insert) {
    if (k in body && body[k] !== undefined && body[k] !== '') {
      cols.push(k)
      vals.push(body[k])
    }
  }
  if (!cols.length) {
    const { rows } = await query(`insert into ${table} default values returning *`)
    return rows[0]
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
  if (table === 'puntos_trabajar' && 'estado' in patch) {
    raw.push(`logrado_at = ${patch.estado === 'logrado' ? 'now()' : 'null'}`)
  }
  if (table === 'metas' && 'estado' in patch) {
    raw.push(`lograda_at = ${patch.estado === 'lograda' ? 'now()' : 'null'}`)
  }
  if (table === 'encuentros' && 'estado' in patch) {
    raw.push(`cerrado_at = ${patch.estado === 'cerrado' ? 'now()' : 'null'}`)
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

// ── Helpers del juego de preguntas ──
async function getConfigVal(clave) {
  const { rows } = await query('select valor from config where clave = $1', [clave])
  return rows[0]?.valor || null
}
async function setConfigVal(clave, valor) {
  await query(
    `insert into config (clave, valor, updated_at) values ($1, $2, now())
     on conflict (clave) do update set valor = excluded.valor, updated_at = now()`,
    [clave, valor]
  )
}
async function nextPendienteId() {
  // nivel más bajo con pendientes, al azar dentro de ese nivel
  const { rows } = await query(
    "select id from preguntas where estado = 'pendiente' order by nivel asc, random() limit 1"
  )
  return rows[0]?.id || null
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
      // Entrar tocando "Soy X": sólo con id, sin contraseña.
      if (id) {
        if (!UUID.test(String(id))) return res.status(401).json({ error: 'No pudimos entrar' })
        const { rows } = await query('select * from perfiles where id = $1', [id])
        const perfil = rows[0]
        if (!perfil) return res.status(401).json({ error: 'No pudimos entrar' })
        return res.json({ token: signToken(perfil), perfil: publicPerfil(perfil) })
      }
      // Fallback por email + contraseña.
      if (!email || !password) return res.status(400).json({ error: 'Faltan datos' })
      const { rows } = await query('select * from perfiles where lower(email) = lower($1)', [
        String(email).trim(),
      ])
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

  // ── Config (clave-valor compartida) ──
  app.get('/api/config', requireAuth, async (_req, res) => {
    const { rows } = await query('select clave, valor from config')
    const obj = {}
    for (const r of rows) obj[r.clave] = r.valor
    res.json(obj)
  })
  app.put('/api/config/:clave', requireAuth, async (req, res) => {
    const { clave } = req.params
    const valor = req.body?.valor
    await query(
      `insert into config (clave, valor, updated_at) values ($1, $2, now())
       on conflict (clave) do update set valor = excluded.valor, updated_at = now()`,
      [clave, valor == null ? null : String(valor)]
    )
    broadcast({ table: 'config', type: 'UPDATE', row: { clave, valor } })
    res.json({ clave, valor })
  })

  // ── Fotos (bytes comprimidos en Postgres; sin Supabase Storage) ──
  app.get('/api/fotos', requireAuth, async (_req, res) => {
    const { rows } = await query(
      'select id, descripcion, mime, subido_por, fecha, created_at from fotos order by created_at desc'
    )
    res.json(rows)
  })
  app.post('/api/fotos', requireAuth, async (req, res) => {
    try {
      const { dataUrl, descripcion } = req.body || {}
      const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '')
      if (!m) return res.status(400).json({ error: 'Imagen inválida' })
      const buf = Buffer.from(m[2], 'base64')
      if (buf.length > 6 * 1024 * 1024) return res.status(413).json({ error: 'La foto pesa demasiado' })
      const { rows } = await query(
        `insert into fotos (descripcion, mime, bytes, subido_por) values ($1, $2, $3, $4)
         returning id, descripcion, mime, subido_por, fecha, created_at`,
        [descripcion || null, m[1], buf, req.user.sub]
      )
      broadcast({ table: 'fotos', type: 'INSERT', row: rows[0] })
      res.status(201).json(rows[0])
    } catch {
      res.status(400).json({ error: 'No se pudo subir la foto' })
    }
  })
  app.get('/api/fotos/:id/raw', async (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token
    if (!verifyToken(token)) return res.status(401).end()
    const { rows } = await query('select mime, bytes from fotos where id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).end()
    res.setHeader('Content-Type', rows[0].mime || 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable')
    res.send(rows[0].bytes)
  })
  app.delete('/api/fotos/:id', requireAuth, async (req, res) => {
    await query('delete from fotos where id = $1', [req.params.id])
    broadcast({ table: 'fotos', type: 'DELETE', row: { id: req.params.id } })
    res.status(204).end()
  })

  // ── Aportar a una meta (incremento atómico) ──
  app.post('/api/metas/:id/aportar', requireAuth, async (req, res) => {
    const monto = Number(req.body?.monto)
    if (!(monto > 0)) return res.status(400).json({ error: 'El aporte tiene que ser mayor a 0' })
    const { rows } = await query(
      'update metas set acumulado = acumulado + $1 where id = $2 returning *',
      [monto, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Meta no encontrada' })
    broadcast({ table: 'metas', type: 'UPDATE', row: rows[0] })
    res.json(rows[0])
  })

  // ── Encuentro: cargar uno nuevo (cierra el abierto y abre uno fresco) ──
  // Atómico (transacción) + invariante de "a lo sumo uno abierto" (índice único
  // parcial). Si dos personas lo tocan a la vez, el perdedor recibe el abierto vigente.
  app.post('/api/encuentro/nuevo', requireAuth, async (req, res) => {
    const titulo = req.body?.titulo || null
    const client = await pool.connect()
    try {
      await client.query('begin')
      const cerrados = await client.query(
        "update encuentros set estado = 'cerrado', cerrado_at = now() where estado = 'abierto' returning *"
      )
      const nuevo = await client.query("insert into encuentros (estado, titulo) values ('abierto', $1) returning *", [titulo])
      await client.query('commit')
      // broadcasts recién después del commit (nunca un cierre sin su apertura)
      for (const r of cerrados.rows) broadcast({ table: 'encuentros', type: 'UPDATE', row: r })
      broadcast({ table: 'encuentros', type: 'INSERT', row: nuevo.rows[0] })
      res.status(201).json(nuevo.rows[0])
    } catch {
      await client.query('rollback').catch(() => {})
      // carrera: ya hay uno abierto → devolvemos ese
      const cur = await query("select * from encuentros where estado = 'abierto' order by created_at desc limit 1")
      if (cur.rows[0]) return res.json(cur.rows[0])
      res.status(500).json({ error: 'No se pudo cargar el encuentro' })
    } finally {
      client.release()
    }
  })

  // ── Juego de preguntas (presencial: se marca Respondí / No respondí) ──
  app.get('/api/juego', requireAuth, async (_req, res) => {
    // asegurar pregunta actual válida
    let actualId = await getConfigVal('pregunta_actual_id')
    let actual = null
    if (actualId) {
      const r = await query('select id, texto, nivel, estado from preguntas where id = $1', [actualId])
      actual = r.rows[0] || null
    }
    if (!actual) {
      const nid = await nextPendienteId()
      if (nid) {
        await setConfigVal('pregunta_actual_id', nid)
        const r = await query('select id, texto, nivel, estado from preguntas where id = $1', [nid])
        actual = r.rows[0]
      }
    }

    let actualData = null
    if (actual) {
      const m = await query('select respondido_por, respondio from respuestas where pregunta_id = $1', [actual.id])
      actualData = {
        id: actual.id,
        texto: actual.texto,
        nivel: actual.nivel,
        marcas: m.rows, // [{ respondido_por, respondio }]
        resuelta: m.rows.length >= 2,
      }
    }

    // progreso
    const pc = await query('select nivel, estado, count(*)::int n from preguntas group by nivel, estado')
    const progreso = {
      respondidas: 0,
      pendientes: 0,
      porNivel: { 1: { total: 0, respondidas: 0 }, 2: { total: 0, respondidas: 0 }, 3: { total: 0, respondidas: 0 } },
    }
    for (const r of pc.rows) {
      if (r.estado === 'respondida') progreso.respondidas += r.n
      else progreso.pendientes += r.n
      const nv = progreso.porNivel[r.nivel]
      if (nv) {
        nv.total += r.n
        if (r.estado === 'respondida') nv.respondidas += r.n
      }
    }

    // colección (preguntas resueltas, con quién respondió y quién no)
    const col = await query(
      `select p.id, p.texto, p.nivel,
         json_agg(json_build_object('por', r.respondido_por, 'respondio', r.respondio) order by r.created_at) as marcas
       from preguntas p join respuestas r on r.pregunta_id = p.id
       where p.estado = 'respondida'
       group by p.id order by max(r.created_at) desc`
    )

    res.json({ actual: actualData, progreso, coleccion: col.rows })
  })

  // Marca el turno de una persona: respondió (estaba preparada) o no.
  app.post('/api/preguntas/:id/marcar', requireAuth, async (req, res) => {
    const { id } = req.params
    const { persona, respondio } = req.body || {}
    if (!persona || !UUID.test(String(persona))) return res.status(400).json({ error: 'Falta la persona' })
    const pq = await query('select id from preguntas where id = $1', [id])
    if (!pq.rows[0]) return res.status(404).json({ error: 'No encontrada' })
    await query(
      `insert into respuestas (pregunta_id, respondido_por, respondio) values ($1, $2, $3)
       on conflict (pregunta_id, respondido_por) do update set respondio = excluded.respondio`,
      [id, persona, !!respondio]
    )
    const cnt = await query('select count(*)::int n from respuestas where pregunta_id = $1', [id])
    if (cnt.rows[0].n >= 2) await query("update preguntas set estado = 'respondida' where id = $1", [id])
    broadcast({ table: 'juego', type: 'UPDATE', row: {} })
    res.json({ ok: true })
  })

  // Volver a poner una pregunta en juego (borra sus marcas)
  app.post('/api/preguntas/:id/reactivar', requireAuth, async (req, res) => {
    await query('delete from respuestas where pregunta_id = $1', [req.params.id])
    await query("update preguntas set estado = 'pendiente' where id = $1", [req.params.id])
    broadcast({ table: 'juego', type: 'UPDATE', row: {} })
    res.json({ ok: true })
  })

  app.post('/api/juego/siguiente', requireAuth, async (_req, res) => {
    await setConfigVal('pregunta_actual_id', await nextPendienteId())
    broadcast({ table: 'juego', type: 'UPDATE', row: {} })
    res.json({ ok: true })
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
