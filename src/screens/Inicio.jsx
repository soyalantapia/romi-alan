import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useJuego } from '../hooks/useJuego'
import { useProfiles } from '../context/ProfilesContext'
import { useConfig } from '../context/ConfigContext'
import Heart from '../components/Heart'
import { PersonAvatar } from '../components/PersonTag'
import { SkeletonCard } from '../components/ui'
import {
  IconCharlar,
  IconCompras,
  IconCaja,
  IconPlanes,
  IconPlus,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconCalendar,
  IconHandHeart,
  IconSparkle,
} from '../components/icons'
import {
  greeting,
  formatDateLong,
  formatMoney,
  formatSigned,
  formatDayMonth,
  countdownLabel,
  daysUntil,
  todayISO,
  hitosRelacion,
} from '../lib/format'

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export default function Inicio() {
  const navigate = useNavigate()
  const { me, other } = useProfiles()
  const { get } = useConfig()
  const juego = useJuego()
  const preguntaActual = juego.data?.actual
  const temas = useRealtimeTable('temas')
  const compras = useRealtimeTable('compras')
  const movimientos = useRealtimeTable('movimientos')
  const planes = useRealtimeTable('planes')
  const metas = useRealtimeTable('metas')

  const loading = temas.loading || compras.loading || movimientos.loading || planes.loading

  const temasPend = useMemo(() => temas.rows.filter((t) => t.estado === 'pendiente'), [temas.rows])
  const comprasPend = useMemo(() => compras.rows.filter((c) => !c.comprado), [compras.rows])

  const saldo = useMemo(
    () =>
      movimientos.rows.reduce(
        (acc, m) => acc + (m.tipo === 'aporte' ? Number(m.monto) : -Number(m.monto)),
        0
      ),
    [movimientos.rows]
  )
  const ultimoMov = useMemo(
    () =>
      [...movimientos.rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null,
    [movimientos.rows]
  )

  const metaTop = useMemo(
    () =>
      metas.rows
        .filter((m) => m.estado === 'activa')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0] || null,
    [metas.rows]
  )

  const proximas = useMemo(
    () =>
      planes.rows
        .filter((p) => p.estado === 'pendiente' && p.fecha && daysUntil(p.fecha) >= 0)
        .sort((a, b) => daysUntil(a.fecha) - daysUntil(b.fecha))
        .slice(0, 3),
    [planes.rows]
  )

  const temasDestacados = useMemo(
    () =>
      [...temasPend]
        .sort((a, b) => {
          const pa = a.prioridad === 'importante' ? 0 : 1
          const pb = b.prioridad === 'importante' ? 0 : 1
          if (pa !== pb) return pa - pb
          return new Date(b.created_at) - new Date(a.created_at)
        })
        .slice(0, 2),
    [temasPend]
  )

  // Contador y hitos
  const fechaInicio = get('fecha_inicio_relacion', '2026-05-21')
  const hitos = hitosRelacion(fechaInicio)

  // Recordatorio del encuentro semanal
  const [yy, mm, dd] = todayISO().split('-').map(Number)
  const dow = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay()
  const encDia = Number(get('encuentro_dia', '0'))
  const diasEnc = (encDia - dow + 7) % 7

  return (
    <div className="page">
      {/* Hero — el signature */}
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

      {/* Contador y hitos */}
      {hitos ? (
        <button
          onClick={() => navigate('/nosotros')}
          className="relative mb-4 w-full overflow-hidden rounded-4xl bg-surface p-5 text-left shadow-soft transition-shadow hover:shadow-lift"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(120% 120% at 100% 0%, rgb(var(--c-primary) / 0.16), transparent 60%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-primary-strong">
              <Heart variant="solid" className="h-4 w-4" />
              <span className="text-2xs font-semibold uppercase tracking-wide">Nosotros</span>
            </div>
            <p className="mt-1.5 font-display text-3xl font-medium tracking-tight">
              Llevamos <span className="nums text-primary-strong">{hitos.dias}</span> días
            </p>
            <p className="text-sm text-muted">
              {hitos.mesesHoy} {hitos.mesesHoy === 1 ? 'mes' : 'meses'} juntos · desde el {formatDayMonth(fechaInicio)}
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
          className="mb-4 flex w-full items-center gap-3 rounded-3xl border border-primary/30 bg-primary-soft p-4 text-left transition-transform active:scale-[0.99]"
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

      {/* Carga rápida */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        <QuickBtn label="Tema" Icon={IconCharlar} onClick={() => navigate('/charlar')} />
        <QuickBtn label="Compra" Icon={IconCompras} onClick={() => navigate('/casa')} />
        <QuickBtn label="Plata" Icon={IconCaja} onClick={() => navigate('/casa')} />
        <QuickBtn label="Plan" Icon={IconPlanes} onClick={() => navigate('/planes')} />
      </div>

      {/* Pregunta del día */}
      {preguntaActual ? (
        <button
          onClick={() => navigate('/nosotros', { state: { tab: 'preguntas' } })}
          className="card mb-6 w-full p-5 text-left transition-shadow duration-200 hover:shadow-lift"
        >
          <div className="flex items-center gap-1.5 text-primary-strong">
            <IconSparkle className="h-4 w-4" />
            <span className="text-2xs font-semibold uppercase tracking-wide">Pregunta para los dos</span>
          </div>
          <p className="mt-1.5 font-display text-lg font-medium leading-snug">{preguntaActual.texto}</p>
          <p className="mt-2 text-sm">
            {preguntaActual.resuelta ? (
              <span className="font-semibold text-accent-strong">¡Respondieron los dos! Ver respuestas →</span>
            ) : preguntaActual.miRespuesta ? (
              <span className="text-muted">Ya respondiste · esperando a {other?.nombre || 'tu pareja'}</span>
            ) : (
              <span className="font-semibold text-primary-strong">Te toca responder →</span>
            )}
          </p>
        </button>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="space-y-4">
          {proximas.length > 0 ? (
            <Card onClick={() => navigate('/planes')} title="Próximas fechas" Icon={IconCalendar}>
              <ul className="mt-3 space-y-2.5">
                {proximas.map((p) => {
                  const soon = daysUntil(p.fecha)
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-text">{p.titulo}</span>
                      <span
                        className={`chip shrink-0 ${soon <= 3 ? 'bg-primary-soft text-primary-strong' : 'bg-accent-soft text-accent-strong'}`}
                      >
                        {formatDayMonth(p.fecha)} · {countdownLabel(p.fecha)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ) : null}

          {/* Caja */}
          <Card onClick={() => navigate('/casa')} title="Caja" Icon={IconCaja}>
            <p className={`nums mt-1 font-display text-4xl font-medium tracking-tight ${saldo < 0 ? 'text-expense' : 'text-text'}`}>
              {formatMoney(saldo)}
            </p>
            {ultimoMov ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                {ultimoMov.tipo === 'aporte' ? (
                  <IconArrowUp className="h-4 w-4 text-income" strokeWidth={2} />
                ) : (
                  <IconArrowDown className="h-4 w-4 text-expense" strokeWidth={2} />
                )}
                Último: <span className="nums font-medium text-text">{formatSigned(ultimoMov.tipo === 'aporte' ? Number(ultimoMov.monto) : -Number(ultimoMov.monto))}</span>
                {ultimoMov.concepto ? ` · ${ultimoMov.concepto}` : ''}
              </p>
            ) : (
              <p className="mt-2 text-sm text-soft">Todavía sin movimientos.</p>
            )}
            {metaTop ? <MetaMini meta={metaTop} /> : null}
          </Card>

          {/* Temas */}
          <Card onClick={() => navigate('/charlar')} title="Para charlar" Icon={IconCharlar} badge={temasPend.length}>
            {temasDestacados.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {temasDestacados.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="truncate text-sm text-text">{t.titulo}</span>
                    {t.prioridad === 'importante' ? <span className="shrink-0 text-2xs font-semibold text-primary-strong">importante</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-soft">Nada pendiente, todo al día.</p>
            )}
          </Card>

          {/* Compras */}
          <Card onClick={() => navigate('/casa')} title="Compras" Icon={IconCompras} badge={comprasPend.length}>
            {comprasPend.length > 0 ? (
              <p className="mt-1 text-sm text-muted">
                {comprasPend.length} {comprasPend.length === 1 ? 'cosa para comprar' : 'cosas para comprar'}.
              </p>
            ) : (
              <p className="mt-1 text-sm text-soft">Lista limpia, no falta nada.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

function MetaMini({ meta }) {
  const obj = Number(meta.objetivo) || 0
  const acu = Number(meta.acumulado) || 0
  const pct = obj > 0 ? Math.min(100, Math.round((acu / obj) * 100)) : 0
  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate text-muted">Meta: {meta.nombre}</span>
        <span className="nums font-semibold text-primary-strong">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function QuickBtn({ label, Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/70 bg-surface px-2 py-3 shadow-soft-sm transition-all duration-200 ease-gentle hover:-translate-y-0.5 active:scale-95"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary-strong">
        <Icon className="h-[1.15rem] w-[1.15rem]" />
        <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary-strong text-on-primary">
          <IconPlus className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </span>
      <span className="text-2xs font-semibold text-muted">{label}</span>
    </button>
  )
}

function Card({ title, Icon, badge, children, onClick }) {
  return (
    <button onClick={onClick} className="card w-full p-5 text-left transition-shadow duration-200 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-muted">
            <Icon className="h-[1.15rem] w-[1.15rem]" />
          </span>
          <h2 className="font-display text-lg font-medium tracking-tight">{title}</h2>
          {badge ? (
            <span className="ml-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary-soft px-1.5 text-2xs font-bold text-primary-strong">
              {badge}
            </span>
          ) : null}
        </div>
        <IconChevronRight className="h-5 w-5 text-soft" />
      </div>
      {children}
    </button>
  )
}
