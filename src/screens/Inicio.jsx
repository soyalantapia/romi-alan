import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
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
} from '../lib/format'

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export default function Inicio() {
  const navigate = useNavigate()
  const { me } = useProfiles()
  const temas = useRealtimeTable('temas')
  const compras = useRealtimeTable('compras')
  const movimientos = useRealtimeTable('movimientos')
  const planes = useRealtimeTable('planes')

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

  const todoVacio =
    !loading &&
    temas.rows.length === 0 &&
    compras.rows.length === 0 &&
    movimientos.rows.length === 0 &&
    planes.rows.length === 0

  return (
    <div className="page">
      {/* Hero — el signature */}
      <div className="relative mb-5 overflow-hidden rounded-4xl bg-surface p-6 shadow-soft">
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

      {/* Carga rápida */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        <QuickBtn label="Tema" Icon={IconCharlar} onClick={() => navigate('/charlar')} />
        <QuickBtn label="Compra" Icon={IconCompras} onClick={() => navigate('/compras')} />
        <QuickBtn label="Plata" Icon={IconCaja} onClick={() => navigate('/caja')} />
        <QuickBtn label="Plan" Icon={IconPlanes} onClick={() => navigate('/planes')} />
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : todoVacio ? (
        <div className="card flex flex-col items-center px-6 py-12 text-center">
          <Heart variant="duo" className="h-14 w-14 animate-heartbeat" />
          <p className="mt-4 font-display text-xl">Bienvenidos a su espacio</p>
          <p className="mt-1.5 max-w-[18rem] text-sm leading-relaxed text-muted">
            Carguen la primera cosa —un tema para charlar, algo del súper, un gasto o un plan— y va a aparecer
            acá y en los dos teléfonos.
          </p>
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
          <Card onClick={() => navigate('/caja')} title="Caja" Icon={IconCaja}>
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
          <Card onClick={() => navigate('/compras')} title="Compras" Icon={IconCompras} badge={comprasPend.length}>
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
