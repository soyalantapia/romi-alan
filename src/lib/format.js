// ─────────────────────────────────────────────────────────────────────────────
//  Formato local — español rioplatense, zona horaria de Buenos Aires.
//  Argentina es UTC−3 todo el año (sin horario de verano), así que para las
//  fechas-solo-día usamos el offset fijo −03:00 y evitamos el clásico bug de
//  "se corre un día".
// ─────────────────────────────────────────────────────────────────────────────

export const TZ = 'America/Argentina/Buenos_Aires'

const money0 = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Monto en pesos: 12500 → "$12.500" ; -1200 → "-$1.200" */
export function formatMoney(n) {
  const v = Number(n) || 0
  const sign = v < 0 ? '-' : ''
  return `${sign}$${money0.format(Math.abs(v))}`
}

/** Igual que formatMoney pero siempre con signo explícito (+/−) para movimientos. */
export function formatSigned(n) {
  const v = Number(n) || 0
  const sign = v < 0 ? '−' : '+'
  return `${sign}$${money0.format(Math.abs(v))}`
}

// ── Fechas ───────────────────────────────────────────────────────────────────

function parseDateAR(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const s = String(value)
  // 'YYYY-MM-DD' (columna date) → mediodía AR para no cruzar de día
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T12:00:00-03:00`)
  return new Date(s)
}

const dfShort = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: TZ,
})
const dfLong = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: TZ,
})
const dfDayMonth = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  timeZone: TZ,
})

/** 14/06/2026 */
export function formatDate(value) {
  const d = parseDateAR(value)
  return d ? dfShort.format(d) : ''
}

/** "sábado 14 de junio" */
export function formatDateLong(value) {
  const d = parseDateAR(value)
  return d ? dfLong.format(d) : ''
}

/** "14 de junio" */
export function formatDayMonth(value) {
  const d = parseDateAR(value)
  return d ? dfDayMonth.format(d) : ''
}

/** ISO 'YYYY-MM-DD' del día de hoy en Buenos Aires. */
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TZ,
  }).format(new Date())
}

function isoToUTCms(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Días enteros desde hoy (AR) hasta la fecha dada. Negativo = ya pasó. */
export function daysUntil(value) {
  if (!value) return null
  const iso = value instanceof Date ? value.toISOString() : String(value)
  const target = isoToUTCms(iso)
  const today = isoToUTCms(todayISO())
  return Math.round((target - today) / 86400000)
}

/** Cuenta regresiva amable: "hoy", "mañana", "en 3 días", "hace 2 días". */
export function countdownLabel(value) {
  const n = daysUntil(value)
  if (n === null) return ''
  if (n === 0) return 'hoy'
  if (n === 1) return 'mañana'
  if (n === -1) return 'ayer'
  if (n > 1) return `en ${n} días`
  return `hace ${Math.abs(n)} días`
}

/** "hace 5 min" / "ayer" / "hace 3 d" — para timestamps absolutos (created_at). */
export function timeAgo(value) {
  if (!value) return ''
  const then = new Date(value).getTime()
  const diff = Date.now() - then
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ayer'
  if (d < 7) return `hace ${d} d`
  return formatDate(value)
}

/** Saludo según la hora de Buenos Aires. */
export function greeting() {
  const h = Number(
    new Intl.DateTimeFormat('es-AR', { hour: 'numeric', hour12: false, timeZone: TZ }).format(
      new Date()
    )
  )
  if (h < 6) return 'Buenas noches'
  if (h < 13) return 'Buen día'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}
