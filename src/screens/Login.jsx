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

function PasswordField({ value, onChange, autoFocus }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        className="input pr-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        autoFocus={autoFocus}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="icon-btn absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2"
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {show ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
      </button>
    </div>
  )
}

export default function Login() {
  const { signIn } = useAuth()
  const [profiles, setProfiles] = useState(null) // null = cargando
  const [selected, setSelected] = useState(null)
  const [emailMode, setEmailMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .quienes()
      .then((p) => setProfiles(Array.isArray(p) ? p : []))
      .catch(() => setProfiles([]))
  }, [])

  const doLogin = async (creds) => {
    setError('')
    setLoading(true)
    try {
      await signIn(creds)
    } catch (err) {
      setError(err.message || 'No pudimos entrar')
      setLoading(false)
    }
  }

  const pick = (p) => {
    setSelected(p)
    setPassword('')
    setError('')
  }
  const back = () => {
    setSelected(null)
    setEmailMode(false)
    setPassword('')
    setError('')
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
          <p className="mt-2 text-muted">
            {selected ? `Hola, ${selected.nombre}` : 'Nuestro espacio. Entrá para verlo.'}
          </p>
        </div>

        <div className="card mt-8 p-6">
          {profiles === null ? (
            <div className="flex justify-center py-6 text-soft">
              <Spinner className="h-6 w-6" />
            </div>
          ) : selected ? (
            // ── Paso 2: contraseña de la persona elegida ──
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (password) doLogin({ id: selected.id, password })
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <Avatar nombre={selected.nombre} color={selected.color} />
                <div className="text-left">
                  <p className="font-display text-lg font-medium leading-tight">{selected.nombre}</p>
                  <p className="text-sm text-muted">Poné tu contraseña</p>
                </div>
              </div>
              <PasswordField value={password} onChange={setPassword} autoFocus />
              {error ? (
                <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
              ) : null}
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner /> : 'Entrar'}
              </button>
              <button type="button" onClick={back} className="w-full text-sm font-semibold text-muted">
                ‹ No soy {selected.nombre}
              </button>
            </form>
          ) : emailMode || !hasPeople ? (
            // ── Login por email (fallback / sin cuentas todavía) ──
            <form
              onSubmit={(e) => {
                e.preventDefault()
                doLogin({ email, password })
              }}
              className="space-y-4"
            >
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
                <PasswordField value={password} onChange={setPassword} />
              </div>
              {error ? (
                <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
              ) : null}
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner /> : 'Entrar'}
              </button>
              {hasPeople ? (
                <button type="button" onClick={back} className="w-full text-sm font-semibold text-muted">
                  ‹ Volver
                </button>
              ) : null}
            </form>
          ) : (
            // ── Paso 1: ¿Quién sos? ──
            <div className="space-y-3">
              <p className="text-center text-sm font-medium text-muted">¿Quién sos?</p>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 text-left transition-all duration-200 ease-gentle hover:border-primary/40 hover:bg-primary-soft active:scale-[0.98]"
                >
                  <Avatar nombre={p.nombre} color={p.color} />
                  <span className="flex-1 font-display text-lg font-medium">Soy {p.nombre}</span>
                  <IconChevronRight className="h-5 w-5 text-soft" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setEmailMode(true)
                  setError('')
                }}
                className="w-full pt-1 text-sm font-semibold text-muted"
              >
                Entrar con email
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-soft">Sólo para nosotros dos · sesión segura</p>
      </div>
    </div>
  )
}
