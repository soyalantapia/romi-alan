import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('⚠️  Falta DATABASE_URL — la base no va a conectar.')
}

// Railway interno (postgres.railway.internal) no usa SSL; el proxy público sí
// puede requerirlo. Permitimos forzarlo con PGSSL=true o sslmode=require.
const needsSsl =
  process.env.PGSSL === 'true' || /sslmode=require/.test(connectionString || '')

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
})

export const query = (text, params) => pool.query(text, params)
