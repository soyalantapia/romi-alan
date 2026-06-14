// Aplica el esquema a la base. Usar con la connection string de Railway:
//   DATABASE_URL="postgres://..." node server/setup-db.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cs = process.env.DATABASE_URL
if (!cs) {
  console.error('✖ Falta DATABASE_URL')
  process.exit(1)
}
const ssl =
  process.env.PGSSL === 'true' || /sslmode=require/.test(cs)
    ? { rejectUnauthorized: false }
    : false

const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
const client = new pg.Client({ connectionString: cs, ssl })

try {
  await client.connect()
  await client.query(sql)
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_name in ('perfiles','temas','compras','movimientos','planes') order by table_name"
  )
  console.log('✓ Esquema aplicado. Tablas:', rows.map((r) => r.table_name).join(', '))
} catch (e) {
  console.error('✖ Error aplicando esquema:', e.message)
  process.exit(1)
} finally {
  await client.end()
}
