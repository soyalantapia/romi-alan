import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-cambiar-en-prod'
// Sesión larga: los dos se mantienen logueados prácticamente siempre.
const EXPIRES = '365d'

export const hashPassword = (plain) => bcrypt.hash(plain, 10)
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash)

export function signToken(perfil) {
  return jwt.sign(
    { sub: perfil.id, email: perfil.email, nombre: perfil.nombre },
    SECRET,
    { expiresIn: EXPIRES }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

// Sin JWT válido, la API no devuelve nada.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const payload = token && verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'No autorizado' })
  req.user = payload
  next()
}
