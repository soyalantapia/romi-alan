import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Heart from '../components/Heart'
import { Spinner } from '../components/ui'
import { IconEye, IconEyeOff } from '../components/icons'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'No pudimos entrar')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center text-center">
          <Heart variant="duo" className="h-16 w-16 animate-heartbeat" title="Romi & Alan" />
          <h1 className="mt-5 font-display text-4xl font-medium tracking-tight">
            Romi <span className="text-primary">&</span> Alan
          </h1>
          <p className="mt-2 text-muted">Nuestro espacio. Entrá para verlo.</p>
        </div>

        <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
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
            <label className="field-label" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                className="input pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </div>

          {error ? (
            <p className="rounded-2xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{error}</p>
          ) : null}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner /> : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-soft">Sólo para nosotros dos · sesión segura</p>
      </div>
    </div>
  )
}
