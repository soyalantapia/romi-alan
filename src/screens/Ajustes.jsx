import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfiles } from '../context/ProfilesContext'
import { useConfig } from '../context/ConfigContext'
import { PersonAvatar } from '../components/PersonTag'
import Heart from '../components/Heart'
import { IconLogout, IconCheck } from '../components/icons'
import {
  ACCENTS,
  getAccent,
  setAccent as persistAccent,
  getTheme,
  setTheme as persistTheme,
} from '../lib/appearance'
import { Toggle } from '../components/ui'

const SWATCHES = ['#C7A3DD', '#9892D6', '#B58FD6', '#8AA8C4', '#8FA98E', '#CE8A99', '#D8A07C', '#C9A26B']
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Ajustes() {
  const { signOut } = useAuth()
  const { me, updateProfile } = useProfiles()
  const { config, get, set } = useConfig()
  const [nombre, setNombre] = useState(me?.nombre || '')
  const [accent, setAccentState] = useState(getAccent())
  const [dark, setDark] = useState(getTheme() === 'dark')
  const [fechaIni, setFechaIni] = useState('2026-05-21')
  const [encDia, setEncDia] = useState('0')
  const [album, setAlbum] = useState('')

  useEffect(() => {
    setFechaIni(get('fecha_inicio_relacion', '2026-05-21'))
    setEncDia(get('encuentro_dia', '0'))
    setAlbum(get('album_google_fotos', ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  const nombreDirty = nombre.trim() && nombre.trim() !== me?.nombre

  const guardarNombre = () => {
    if (nombreDirty) updateProfile({ nombre: nombre.trim() })
  }
  const elegirColor = (color) => updateProfile({ color })
  const elegirAccent = (name) => {
    setAccentState(name)
    persistAccent(name)
  }
  const toggleDark = (v) => {
    setDark(v)
    persistTheme(v ? 'dark' : 'light')
  }

  return (
    <div className="page">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-medium tracking-tight">Ajustes</h1>
      </header>

      {/* Perfil */}
      <section className="card p-5">
        <div className="flex items-center gap-3">
          <PersonAvatar id={me?.id} size="lg" />
          <div>
            <p className="font-display text-lg font-medium">{me?.nombre}</p>
            <p className="text-sm text-muted">{me?.email}</p>
          </div>
        </div>

        <div className="mt-5">
          <label className="field-label" htmlFor="nombre">
            Tu nombre
          </label>
          <div className="flex gap-2">
            <input id="nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={guardarNombre} />
            {nombreDirty ? (
              <button onClick={guardarNombre} className="btn-primary shrink-0 !px-4" aria-label="Guardar nombre">
                <IconCheck className="h-5 w-5" strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <label className="field-label">Tu color</label>
          <div className="flex flex-wrap gap-2.5">
            {SWATCHES.map((c) => {
              const active = (me?.color || '').toLowerCase() === c.toLowerCase()
              return (
                <button
                  key={c}
                  onClick={() => elegirColor(c)}
                  className={`grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90 ${active ? 'ring-2 ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c, '--tw-ring-color': c }}
                  aria-label={`Elegir color ${c}`}
                >
                  {active ? <IconCheck className="h-4 w-4 text-white" strokeWidth={3} /> : null}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-soft">Con este color se etiqueta lo que vas cargando.</p>
        </div>
      </section>

      {/* Apariencia */}
      <section className="card mt-4 p-5">
        <h2 className="font-display text-lg font-medium">Apariencia</h2>
        <div className="mt-4">
          <label className="field-label">Acento</label>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(ACCENTS).map(([key, a]) => {
              const active = accent === key
              return (
                <button
                  key={key}
                  onClick={() => elegirAccent(key)}
                  className={`grid h-9 w-9 place-items-center rounded-full transition-transform active:scale-90 ${active ? 'ring-2 ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: a.dot, '--tw-ring-color': a.dot }}
                  aria-label={`Acento ${a.label}`}
                >
                  {active ? <IconCheck className="h-4 w-4 text-white" strokeWidth={3} /> : null}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm font-medium text-text">Modo oscuro</span>
          <Toggle checked={dark} onChange={toggleDark} />
        </div>
      </section>

      {/* Nuestra relación */}
      <section className="card mt-4 p-5">
        <h2 className="font-display text-lg font-medium">Nuestra relación</h2>
        <div className="mt-4">
          <label className="field-label" htmlFor="fini">Fecha de inicio</label>
          <input
            id="fini"
            type="date"
            className="input nums"
            value={fechaIni}
            onChange={(e) => {
              setFechaIni(e.target.value)
              set('fecha_inicio_relacion', e.target.value)
            }}
          />
          <p className="mt-1.5 text-xs text-soft">Desde acá contamos los días juntos y los aniversarios.</p>
        </div>
        <div className="mt-4">
          <label className="field-label" htmlFor="edia">Día del encuentro</label>
          <select
            id="edia"
            className="input"
            value={encDia}
            onChange={(e) => {
              setEncDia(e.target.value)
              set('encuentro_dia', e.target.value)
            }}
          >
            {DIAS.map((d, i) => (
              <option key={i} value={String(i)}>
                {d}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-soft">Te lo recordamos en Inicio cuando se acerca.</p>
        </div>
        <div className="mt-4">
          <label className="field-label" htmlFor="alb">Álbum de Google Fotos</label>
          <input
            id="alb"
            type="url"
            className="input"
            placeholder="https://photos.app.goo.gl/…"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            onBlur={() => set('album_google_fotos', album.trim())}
          />
          <p className="mt-1.5 text-xs text-soft">Opcional: un botón en Fotos abre el álbum.</p>
        </div>
      </section>

      {/* Cuenta */}
      <section className="mt-4">
        <button onClick={signOut} className="btn-ghost w-full justify-start gap-3 px-5 py-4 text-danger hover:bg-danger/10">
          <IconLogout className="h-5 w-5" />
          Cerrar sesión
        </button>
      </section>

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <Heart variant="duo" className="h-7 w-7" />
        <p className="font-display text-sm text-muted">
          Romi <span className="text-primary">&</span> Alan
        </p>
        <p className="text-2xs text-soft">Hecho con cariño · v1.0</p>
      </div>
    </div>
  )
}
