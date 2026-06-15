// Cliente HTTP del frontend contra el backend propio (mismo origen, /api).
const TOKEN_KEY = 'romi-alan-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && path !== '/auth/login') {
    setToken(null)
    window.dispatchEvent(new Event('auth:logout'))
  }
  if (res.status === 204) return null

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'Algo salió mal')
  return data
}

export const api = {
  // creds = { id, password } (selector "Soy Romi/Soy Alan") o { email, password }
  login: (creds) => request('/auth/login', { method: 'POST', body: creds }),
  quienes: () => request('/quienes'),
  me: () => request('/me'),
  perfiles: () => request('/perfiles'),
  updateProfile: (patch) => request('/perfiles/me', { method: 'PATCH', body: patch }),
  list: (table) => request(`/${table}`),
  insert: (table, payload) => request(`/${table}`, { method: 'POST', body: payload }),
  update: (table, id, patch) => request(`/${table}/${id}`, { method: 'PATCH', body: patch }),
  remove: (table, id) => request(`/${table}/${id}`, { method: 'DELETE' }),
  // ── Addendum ──
  getConfig: () => request('/config'),
  setConfig: (clave, valor) => request(`/config/${clave}`, { method: 'PUT', body: { valor } }),
  aportarMeta: (id, monto) => request(`/metas/${id}/aportar`, { method: 'POST', body: { monto } }),
  // URL directa de una foto (con token en query para que <img> la cargue)
  fotoUrl: (id) => `/api/fotos/${id}/raw?token=${encodeURIComponent(getToken() || '')}`,
  // ── Juego de preguntas ──
  getJuego: () => request('/juego'),
  marcar: (id, persona, respondio) => request(`/preguntas/${id}/marcar`, { method: 'POST', body: { persona, respondio } }),
  reactivar: (id) => request(`/preguntas/${id}/reactivar`, { method: 'POST' }),
  siguiente: () => request('/juego/siguiente', { method: 'POST' }),
}
