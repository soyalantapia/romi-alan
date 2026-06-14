import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Heart from '../components/Heart'
import { Spinner } from '../components/ui'
import { IconEye, IconEyeOff, IconChevronRight } from '../components/icons'

function Avatar({ nombre, color }) {
  return (
    <span
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-xl font-semibold"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {(nombre || '?').charAt(0).toUpperCase()}
    </span>
  )
}

export default function Login() {
  const { signIn } = useAuth()
  const [profiles, setProfiles] = useState(null) // null = cargando
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  // fallback por email (sólo si no se pueden listar las personas)
  const [emailMode, setEmailMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    api
      .quienes()
      .then((p) => setProfiles(Array.isArray(p) ? p : []))
      .catch(() => setProfiles([]))
  }, [])

  // Tocar "Soy X" → entra directo (sin contraseña). La sesión queda guardada.
  const entrar = async (p) => {
    setError('')
    setBusyId(p.id)
    try {
      await signIn({ id: p.id })
    } catch {
      setError('No pudimos entrar. Probá de nuevo.')
      setBusyId(null)
    }
  }

  const entrarEmail = async (e) => {
    e.preventDefault()
    setError('')
    setBusyId('email')
    try {
      await signIn({ email, password })
    } catch (err) {
      setError(err.message || 'No pudimos entrar')
      setBusyId(null)
    }
  }

  const hasPeople = Array.isArray(profiles) && profiles.length > 0

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <Heart variant="duo" className="h-16 w-16 animate-heartbeat" title="Romi & Alan" />
          <h1 className="mt-5 font-display text-4xl font-medium tracking-tight">
            Romi <span className="text-primary">&</span> Alan
          </h1>
          <p className="mt-2 text-muted">Nuestro espacio. Tocá quién sos.</p>
        </div>

        <div className="card mt-8 p-6">
          {profiles === null ? (
            <div className="flex justify-center py-6 text-soft">
              <Spinner className="h-6 w-6" />
            </div>
          ) : hasPeople && !emailMode ? (
            // ── Tocá quién sos → entrás ──
            <div className="space-y-3">
              {profiles.map((p) => {
                const busy = busyId === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => entrar(p)}
                    disabled={!!busyId}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 text-left transition-all duration-200 ease-gentle hover:border-primary/40 hover:bg-primary-soft active:scale-[0.98] disabled:opacity-60"
                  >
                    <Avatar nombre={p.nombre} color={p.color} />
                    <span className="flex-1 font-display text-lg font-medium">Soy {p.nombre}</span>
                    {busy ? (
                      <Spinner className="h-5 w-5 text-primary-strong" />
                    ) : (
                      <IconChevronRight className="h-5 w-5 text-soft" />
                    )}
                  </button>
                )
              })}
              {error ? <p className="pt-1 text-center text-sm text-danger">{error}</p> : null}
            </div>
          ) : (
            // ── Fallback por email (sin personas listadas) ──
            <form onSubmit={entrarEmail} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="pass">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="pass"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="input pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="icon-btn absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2"
                    aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPass ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {error ? (
                <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
              ) : null}
              <button className="btn-primary w-full" disabled={busyId === 'email'}>
                {busyId === 'email' ? <Spinner /> : 'Entrar'}
              </button>
              {hasPeople ? (
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode(false)
                    setError('')
                  }}
                  className="w-full text-sm font-semibold text-muted"
                >
                  ‹ Volver
                </button>
              ) : null}
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-soft">Su espacio · la sesión queda guardada</p>
      </div>
    </div>
  )
}
