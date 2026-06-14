// Crea (o actualiza) las 2 cuentas de la pareja. No hay registro público:
// estas son las únicas dos cuentas que van a existir.
//
//   DATABASE_URL="postgres://..." \
//   ROMI_EMAIL=... ROMI_NOMBRE=Romi ROMI_COLOR=#CE8A99 [ROMI_PASSWORD=...] \
//   ALAN_EMAIL=... ALAN_NOMBRE=Alan ALAN_COLOR=#7FA08E [ALAN_PASSWORD=...] \
//   node server/seed.mjs
//
// Si no se pasa contraseña, se genera una segura y se imprime una sola vez.
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const cs = process.env.DATABASE_URL
if (!cs) {
  console.error('✖ Falta DATABASE_URL')
  process.exit(1)
}
const ssl =
  process.env.PGSSL === 'true' || /sslmode=require/.test(cs)
    ? { rejectUnauthorized: false }
    : false

function genPassword() {
  // legible y fuerte: 12 chars base58-ish
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(12)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

const people = [
  {
    email: process.env.ROMI_EMAIL,
    nombre: process.env.ROMI_NOMBRE || 'Romi',
    color: process.env.ROMI_COLOR || '#C7A3DD',
    password: process.env.ROMI_PASSWORD,
  },
  {
    email: process.env.ALAN_EMAIL,
    nombre: process.env.ALAN_NOMBRE || 'Alan',
    color: process.env.ALAN_COLOR || '#9892D6',
    password: process.env.ALAN_PASSWORD,
  },
]

const missing = people.filter((p) => !p.email)
if (missing.length) {
  console.error('✖ Faltan emails (ROMI_EMAIL / ALAN_EMAIL)')
  process.exit(1)
}

const client = new pg.Client({ connectionString: cs, ssl })
const generated = []

try {
  await client.connect()
  for (const p of people) {
    const password = p.password || genPassword()
    if (!p.password) generated.push({ email: p.email, password })
    const hash = await bcrypt.hash(password, 10)
    await client.query(
      `insert into perfiles (email, password_hash, nombre, color)
       values (lower($1), $2, $3, $4)
       on conflict (email) do update
         set password_hash = excluded.password_hash,
             nombre = excluded.nombre,
             color = excluded.color`,
      [p.email, hash, p.nombre, p.color]
    )
    console.log(`✓ Cuenta lista: ${p.nombre} <${p.email.toLowerCase()}>`)
  }
  if (generated.length) {
    console.log('\n── Contraseñas generadas (guardalas, no se vuelven a mostrar) ──')
    for (const g of generated) console.log(`   ${g.email.toLowerCase()}  →  ${g.password}`)
    console.log('───────────────────────────────────────────────────────────────')
  }
} catch (e) {
  console.error('✖ Error en seed:', e.message)
  process.exit(1)
} finally {
  await client.end()
}
