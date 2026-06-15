import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useJuego } from '../hooks/useJuego'
import { useProfiles } from '../context/ProfilesContext'
import { useConfig } from '../context/ConfigContext'
import Heart from '../components/Heart'
import { PersonAvatar } from '../components/PersonTag'
import {
  IconCharlar,
  IconCasa,
  IconPlanes,
  IconHandHeart,
  IconFoto,
  IconSparkle,
  IconChevronRight,
  IconCalendar,
} from '../components/icons'
import {
  greeting,
  formatDateLong,
  formatDayMonth,
  countdownLabel,
  daysUntil,
  todayISO,
  hitosRelacion,
} from '../lib/format'

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export default function Inicio() {
  const navigate = useNavigate()
  const { me } = useProfiles()
  const { get } = useConfig()
  const juego = useJuego()
  const temas = useRealtimeTable('temas')
  const compras = useRealtimeTable('compras')
  const planes = useRealtimeTable('planes')
  const fotos = useRealtimeTable('fotos')

  const temasPend = useMemo(() => temas.rows.filter((t) => t.estado === 'pendiente').length, [temas.rows])
  const comprasPend = useMemo(() => compras.rows.filter((c) => !c.comprado).length, [compras.rows])
  const proximas = useMemo(
    () =>
      planes.rows
        .filter((p) => p.estado === 'pendiente' && p.fecha && daysUntil(p.fecha) >= 0)
        .sort((a, b) => daysUntil(a.fecha) - daysUntil(b.fecha)),
    [planes.rows]
  )

  const hitos = hitosRelacion(get('fecha_inicio_relacion', '2026-05-21'))
  const [yy, mm, dd] = todayISO().split('-').map(Number)
  const dow = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay()
  const diasEnc = (Number(get('encuentro_dia', '0')) - dow + 7) % 7

  const actual = juego.data?.actual
  const algunoMarco = actual && (actual.marcas || []).length > 0
  const preguntaEstado = !actual
    ? 'Completaron todas'
    : actual.resuelta
      ? '¡Listo! Pasen a la siguiente'
      : algunoMarco
        ? 'Falta marcar un turno'
        : 'Te toca jugar'

  return (
    <div className="page">
      {/* Hero */}
      <div className="relative mb-4 overflow-hidden rounded-4xl bg-surface p-6 shadow-soft">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(120% 90% at 0% 0%, rgb(var(--c-primary) / 0.14), transparent 55%), radial-gradient(120% 90% at 100% 20%, rgb(var(--c-accent) / 0.14), transparent 55%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart variant="duo" className="h-6 w-6" title="Romi & Alan" />
              <p className="text-sm font-medium text-muted">{cap(formatDateLong(todayISO()))}</p>
            </div>
            <button onClick={() => navigate('/ajustes')} className="icon-btn h-10 w-10" aria-label="Ajustes">
              <PersonAvatar id={me?.id} size="sm" />
            </button>
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight">
            {greeting()}
            {me?.nombre ? <span className="text-primary">, {me.nombre}</span> : null}
          </h1>
          <p className="mt-1 text-sm text-muted">Su espacio, en un vistazo.</p>
        </div>
      </div>

      {/* Contador */}
      {hitos ? (
        <button
          onClick={() => navigate('/nosotros')}
          className="relative mb-4 w-full overflow-hidden rounded-4xl bg-surface p-5 text-left shadow-soft transition-shadow hover:shadow-lift"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(120% 120% at 100% 0%, rgb(var(--c-primary) / 0.16), transparent 60%)' }}
          />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-primary-strong">
              <Heart variant="solid" className="h-4 w-4" />
              <span className="text-2xs font-semibold uppercase tracking-wide">Nosotros</span>
            </div>
            <p className="mt-1.5 font-display text-3xl font-medium tracking-tight">
              Llevamos <span className="nums text-primary-strong">{hitos.dias}</span> días
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {hitos.mensual.dias === 0 ? (
                <span className="chip bg-primary-soft text-primary-strong">¡Hoy cumplen {hitos.mensual.meses} meses!</span>
              ) : hitos.mensual.dias <= 7 ? (
                <span className="chip bg-primary-soft text-primary-strong">
                  En {hitos.mensual.dias} {hitos.mensual.dias === 1 ? 'día' : 'días'}: {hitos.mensual.meses}{' '}
                  {hitos.mensual.meses === 1 ? 'mes' : 'meses'}
                </span>
              ) : null}
              <span className="chip bg-accent-soft text-accent-strong">
                {hitos.anual.dias === 0 ? '¡Feliz aniversario!' : `Aniversario en ${hitos.anual.dias} días`}
              </span>
            </div>
          </div>
        </button>
      ) : null}

      {/* Recordatorio del encuentro */}
      {diasEnc <= 1 ? (
        <button
          onClick={() => navigate('/nosotros')}
          className="mb-4 flex w-full items-center gap-3 rounded-3xl border border-primary/30 bg-primary-soft p-4 text-left active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface text-primary-strong">
            <IconHandHeart className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-display text-base font-medium text-primary-strong">
              {diasEnc === 0 ? 'Hoy es su encuentro' : 'Mañana: su encuentro'}
            </p>
            <p className="text-sm text-muted">Un ratito para hablar de la semana.</p>
          </div>
          <IconChevronRight className="h-5 w-5 text-primary-strong/60" />
        </button>
      ) : null}

      {/* Secciones */}
      <h2 className="mb-2.5 mt-6 px-1 text-sm font-semibold uppercase tracking-wide text-soft">Secciones</h2>
      <div className="grid grid-cols-2 gap-3">
        <SectionBlock Icon={IconCharlar} title="Charlar" stat={temasPend > 0 ? `${temasPend} para hablar` : 'Todo al día'} onClick={() => navigate('/charlar')} />
        <SectionBlock Icon={IconCasa} title="Casa" stat={comprasPend > 0 ? `${comprasPend} en la lista` : 'Lista al día'} onClick={() => navigate('/casa')} />
        <SectionBlock Icon={IconPlanes} title="Planes" stat={proximas[0] ? `Próximo: ${countdownLabel(proximas[0].fecha)}` : 'Sueñen algo'} onClick={() => navigate('/planes')} />
        <SectionBlock Icon={IconHandHeart} title="Conexión" stat="Pulso y encuentro" onClick={() => navigate('/conexion')} />
        <SectionBlock Icon={IconFoto} title="Fotos" stat={fotos.rows.length > 0 ? `${fotos.rows.length} fotos` : 'Subí la primera'} onClick={() => navigate('/fotos')} />
        <SectionBlock Icon={IconSparkle} title="Preguntas" stat={preguntaEstado} onClick={() => navigate('/preguntas')} />
      </div>

      {/* Resumen: próximas fechas */}
      {proximas.length > 0 ? (
        <button onClick={() => navigate('/planes')} className="card mt-3 w-full p-5 text-left transition-shadow hover:shadow-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-muted">
                <IconCalendar className="h-[1.15rem] w-[1.15rem]" />
              </span>
              <h2 className="font-display text-lg font-medium tracking-tight">Próximas fechas</h2>
            </div>
            <IconChevronRight className="h-5 w-5 text-soft" />
          </div>
          <ul className="mt-3 space-y-2.5">
            {proximas.slice(0, 3).map((p) => {
              const soon = daysUntil(p.fecha)
              return (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-text">{p.titulo}</span>
                  <span className={`chip shrink-0 ${soon <= 3 ? 'bg-primary-soft text-primary-strong' : 'bg-accent-soft text-accent-strong'}`}>
                    {formatDayMonth(p.fecha)} · {countdownLabel(p.fecha)}
                  </span>
                </li>
              )
            })}
          </ul>
        </button>
      ) : null}
    </div>
  )
}

function SectionBlock({ Icon, title, stat, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card flex flex-col gap-2.5 p-4 text-left transition-all duration-200 ease-gentle hover:-translate-y-0.5 hover:shadow-lift active:scale-95"
    >
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-base font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{stat}</p>
      </div>
    </button>
  )
}
