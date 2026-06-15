import { useEffect, useMemo, useRef, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import { api } from '../lib/api'
import PersonTag from '../components/PersonTag'
import Heart from '../components/Heart'
import { Segmented, EmptyState, Spinner } from '../components/ui'
import { IconPlus, IconCheck, IconTrash, IconChevronDown, IconHandHeart, IconSparkle } from '../components/icons'
import { formatDate, formatDayMonth, timeAgo, todayISO } from '../lib/format'

const recientes = (a, b) => new Date(b.created_at) - new Date(a.created_at)

export default function Encuentro() {
  const encuentros = useRealtimeTable('encuentros')
  const momentos = useRealtimeTable('momentos')
  const puntos = useRealtimeTable('puntos_trabajar')
  const { me } = useProfiles()
  const [tab, setTab] = useState('actual')
  const [creando, setCreando] = useState(false)
  const creandoRef = useRef(false)

  const actual = useMemo(
    () => encuentros.rows.filter((e) => e.estado === 'abierto').sort(recientes)[0] || null,
    [encuentros.rows]
  )
  const pasados = useMemo(
    () => encuentros.rows.filter((e) => e.estado === 'cerrado').sort(recientes),
    [encuentros.rows]
  )

  const cargarNuevo = async () => {
    if (creandoRef.current) return // guarda síncrona: evita doble-tap
    creandoRef.current = true
    setCreando(true)
    setTab('actual') // optimista, antes de los awaits (no pisa navegación posterior)
    try {
      await api.nuevoEncuentro(`Semana del ${formatDayMonth(todayISO())}`)
      await encuentros.refresh?.()
    } finally {
      setCreando(false)
      creandoRef.current = false
    }
  }

  return (
    <div className="page">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Encuentro</h1>
          <p className="mt-0.5 text-sm text-muted">Su ratito de la semana, guardado.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'actual', label: 'Esta semana' },
            { value: 'pasados', label: 'Anteriores', count: pasados.length },
          ]}
        />
      </div>

      {tab === 'actual' ? (
        <Actual
          encuentro={actual}
          momentos={momentos}
          puntos={puntos}
          encuentros={encuentros}
          meId={me?.id}
          creando={creando}
          onCargarNuevo={cargarNuevo}
        />
      ) : (
        <Anteriores pasados={pasados} momentos={momentos.rows} puntos={puntos.rows} />
      )}
    </div>
  )
}

function Actual({ encuentro, momentos, puntos, encuentros, meId, creando, onCargarNuevo }) {
  if (!encuentro) {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <Heart variant="duo" className="h-14 w-14 animate-heartbeat" />
        <p className="mt-4 font-display text-xl">Empiecen el encuentro de esta semana</p>
        <p className="mt-1.5 max-w-[18rem] text-sm leading-relaxed text-muted">
          Cargá uno nuevo y van sumando los momentos lindos, lo que quieren trabajar y los acuerdos.
        </p>
        <button onClick={onCargarNuevo} disabled={creando} className="btn-primary mt-5">
          {creando ? <Spinner /> : <><IconPlus className="h-5 w-5" /> Cargar nuevo encuentro</>}
        </button>
      </div>
    )
  }

  const buenos = momentos.rows.filter((m) => m.encuentro_id === encuentro.id).sort(recientes)
  const activos = puntos.rows.filter((p) => p.encuentro_id === encuentro.id && p.estado === 'activo').sort(recientes)
  const logrados = puntos.rows.filter((p) => p.encuentro_id === encuentro.id && p.estado === 'logrado').sort(recientes)

  return (
    <div className="space-y-7">
      {/* Cabecera del encuentro en curso */}
      <div className="rounded-3xl border border-primary/25 bg-primary-soft p-4">
        <div className="flex items-center gap-2 text-primary-strong">
          <IconHandHeart className="h-5 w-5" />
          <span className="text-2xs font-semibold uppercase tracking-wide">En curso</span>
        </div>
        <p className="mt-1 font-display text-xl font-medium">{encuentro.titulo || formatDate(encuentro.fecha)}</p>
        <p className="text-sm text-muted">Iniciado el {formatDate(encuentro.fecha)}</p>
      </div>

      {/* Lo bueno */}
      <Bloque titulo="Lo bueno de la semana" sub="Momentos lindos y gracias.">
        <MomentoAdd onAdd={(p) => momentos.add({ ...p, encuentro_id: encuentro.id, creado_por: meId })} />
        <div className="mt-3 space-y-2.5">
          {buenos.length === 0 ? (
            <Vacio>Anotá un momento lindo o un “gracias por…”.</Vacio>
          ) : (
            buenos.map((m) => (
              <ItemRow key={m.id} item={m} onDelete={() => momentos.remove(m.id)}>
                {m.tipo === 'agradecimiento' ? (
                  <span className="chip bg-primary-soft text-primary-strong">gracias</span>
                ) : (
                  <span className="chip bg-accent-soft text-accent-strong">momento</span>
                )}
              </ItemRow>
            ))
          )}
        </div>
      </Bloque>

      {/* Para trabajar */}
      <Bloque titulo="Para trabajar" sub="En primera persona: en qué querés trabajar vos.">
        <PuntoAdd onAdd={(p) => puntos.add({ ...p, encuentro_id: encuentro.id, creado_por: meId })} />
        <div className="mt-3 space-y-2.5">
          {activos.length === 0 && logrados.length === 0 ? (
            <Vacio>Sumá algo que quieras trabajar esta semana.</Vacio>
          ) : (
            <>
              {activos.map((p) => (
                <ItemRow key={p.id} item={p} onCheck={() => puntos.update(p.id, { estado: 'logrado' })} onDelete={() => puntos.remove(p.id)}>
                  <span className={`chip ${p.tipo === 'necesidad' ? 'bg-accent-soft text-accent-strong' : 'bg-primary-soft text-primary-strong'}`}>
                    {p.tipo === 'necesidad' ? 'me haría bien' : 'quiero trabajar'}
                  </span>
                </ItemRow>
              ))}
              {logrados.map((p) => (
                <ItemRow key={p.id} item={p} done onDelete={() => puntos.remove(p.id)}>
                  <span className="chip bg-income-soft text-income">logrado</span>
                </ItemRow>
              ))}
            </>
          )}
        </div>
      </Bloque>

      {/* Acuerdos */}
      <Bloque titulo="Acuerdos" sub="¿Qué van a intentar esta semana?">
        <AcuerdosEditor encuentro={encuentro} onSave={(acuerdos) => encuentros.update(encuentro.id, { acuerdos })} />
      </Bloque>

      <button onClick={onCargarNuevo} disabled={creando} className="btn-soft w-full">
        {creando ? <Spinner /> : <><IconPlus className="h-5 w-5" /> Cerrar y cargar uno nuevo</>}
      </button>
    </div>
  )
}

function Anteriores({ pasados, momentos, puntos }) {
  if (!pasados.length) {
    return <EmptyState icon={IconSparkle} title="Todavía no hay encuentros pasados" hint="Cuando cierren uno, queda guardado acá con todo lo que sumaron." />
  }
  return (
    <div className="space-y-3">
      {pasados.map((e) => (
        <EncuentroPasado key={e.id} encuentro={e} momentos={momentos} puntos={puntos} />
      ))}
    </div>
  )
}

function EncuentroPasado({ encuentro, momentos, puntos }) {
  const [open, setOpen] = useState(false)
  const buenos = momentos.filter((m) => m.encuentro_id === encuentro.id)
  const pts = puntos.filter((p) => p.encuentro_id === encuentro.id)
  return (
    <div className="card p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="font-display text-lg font-medium leading-tight">{encuentro.titulo || formatDate(encuentro.fecha)}</p>
          <p className="text-sm text-muted">
            {buenos.length} de lo bueno · {pts.length} para trabajar
          </p>
        </div>
        <IconChevronDown className={`h-5 w-5 shrink-0 text-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="mt-4 space-y-4 animate-fade-up border-t border-border/60 pt-4">
          <Mini titulo="Lo bueno">
            {buenos.length ? buenos.map((m) => <MiniItem key={m.id} texto={m.texto} por={m.creado_por} tag={m.tipo === 'agradecimiento' ? 'gracias' : 'momento'} />) : <Vacio>Nada anotado.</Vacio>}
          </Mini>
          <Mini titulo="Para trabajar">
            {pts.length ? pts.map((p) => <MiniItem key={p.id} texto={p.texto} por={p.creado_por} tag={p.estado === 'logrado' ? 'logrado' : p.tipo === 'necesidad' ? 'me haría bien' : 'quiero trabajar'} />) : <Vacio>Nada anotado.</Vacio>}
          </Mini>
          <Mini titulo="Acuerdos">
            {encuentro.acuerdos ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{encuentro.acuerdos}</p> : <Vacio>Sin acuerdos.</Vacio>}
          </Mini>
        </div>
      ) : null}
    </div>
  )
}

// ── piezas ──
function Bloque({ titulo, sub, children }) {
  return (
    <div>
      <div className="mb-2.5 px-1">
        <h2 className="font-display text-xl font-medium tracking-tight">{titulo}</h2>
        <p className="text-sm text-muted">{sub}</p>
      </div>
      {children}
    </div>
  )
}

function Vacio({ children }) {
  return <p className="px-1 text-sm text-soft">{children}</p>
}

function Mini({ titulo, children }) {
  return (
    <div>
      <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wide text-soft">{titulo}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function MiniItem({ texto, por, tag }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="text-text">{texto}</span>
      <span className="ml-auto shrink-0 text-2xs text-soft">{tag}</span>
    </div>
  )
}

function ItemRow({ item, children, onCheck, onDelete, done }) {
  return (
    <div className={`card flex items-start gap-3 p-3.5 ${item._pending ? 'opacity-60' : ''}`}>
      {onCheck ? (
        <button onClick={onCheck} className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-border text-transparent transition-colors hover:border-accent" aria-label="Marcar logrado">
          <IconCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      ) : done ? (
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-income text-white">
          <IconCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className={`text-text ${done ? 'line-through opacity-60' : ''}`}>{item.texto}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {children}
          <PersonTag id={item.creado_por} suffix={timeAgo(item.created_at)} />
        </div>
      </div>
      <button onClick={onDelete} className="icon-btn h-8 w-8 shrink-0 hover:text-danger" aria-label="Eliminar">
        <IconTrash className="h-[1.05rem] w-[1.05rem]" />
      </button>
    </div>
  )
}

function MomentoAdd({ onAdd }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('momento')
  const submit = (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    onAdd({ texto: texto.trim(), tipo })
    setTexto('')
  }
  return (
    <form onSubmit={submit} className="card p-2.5">
      <input
        className="input border-transparent bg-transparent focus:bg-transparent"
        placeholder={tipo === 'agradecimiento' ? 'Gracias por…' : 'Un momento lindo de la semana…'}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2 px-1">
        <button type="button" onClick={() => setTipo('momento')} data-active={tipo === 'momento'} className="chip border border-border bg-surface-2 data-[active=true]:border-accent/50 data-[active=true]:bg-accent-soft data-[active=true]:text-accent-strong">
          Momento
        </button>
        <button type="button" onClick={() => setTipo('agradecimiento')} data-active={tipo === 'agradecimiento'} className="chip border border-border bg-surface-2 data-[active=true]:border-primary/50 data-[active=true]:bg-primary-soft data-[active=true]:text-primary-strong">
          Gracias
        </button>
        <button type="submit" className="btn-primary ml-auto h-9 w-9 shrink-0 !px-0" aria-label="Agregar">
          <IconPlus className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
}

function PuntoAdd({ onAdd }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('propio')
  const submit = (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    onAdd({ texto: texto.trim(), tipo })
    setTexto('')
  }
  return (
    <form onSubmit={submit} className="card p-2.5">
      <input
        className="input border-transparent bg-transparent focus:bg-transparent"
        placeholder={tipo === 'necesidad' ? 'Me haría bien si…' : 'Quiero trabajar en…'}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2 px-1">
        <button type="button" onClick={() => setTipo('propio')} data-active={tipo === 'propio'} className="chip border border-border bg-surface-2 data-[active=true]:border-primary/50 data-[active=true]:bg-primary-soft data-[active=true]:text-primary-strong">
          Quiero trabajar
        </button>
        <button type="button" onClick={() => setTipo('necesidad')} data-active={tipo === 'necesidad'} className="chip border border-border bg-surface-2 data-[active=true]:border-accent/50 data-[active=true]:bg-accent-soft data-[active=true]:text-accent-strong">
          Me haría bien
        </button>
        <button type="submit" className="btn-primary ml-auto h-9 w-9 shrink-0 !px-0" aria-label="Agregar">
          <IconPlus className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
}

function AcuerdosEditor({ encuentro, onSave }) {
  const [texto, setTexto] = useState(encuentro.acuerdos || '')
  const [guardado, setGuardado] = useState(false)
  const timer = useRef(null)
  const editando = useRef(false)

  // Sincronizar con cambios (incluso los que escribe el otro por realtime),
  // pero sólo si no estoy editando, para no pisar lo que estoy tipeando.
  useEffect(() => {
    if (!editando.current) setTexto(encuentro.acuerdos || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encuentro.id, encuentro.acuerdos])

  useEffect(() => () => clearTimeout(timer.current), [])

  const persistir = (v) => {
    if ((encuentro.acuerdos || '') === v.trim()) return
    onSave(v.trim())
    setGuardado(true)
    setTimeout(() => setGuardado(false), 1500)
  }
  const onChange = (v) => {
    setTexto(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => persistir(v), 700)
  }
  return (
    <div className="card p-3">
      <textarea
        className="input border-transparent bg-transparent focus:bg-transparent"
        rows={3}
        placeholder="Esta semana vamos a intentar…"
        value={texto}
        onFocus={() => {
          editando.current = true
        }}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          editando.current = false
          clearTimeout(timer.current)
          persistir(texto)
        }}
      />
      {guardado ? <p className="px-1 pt-1 text-2xs font-semibold text-income">Guardado ✓</p> : null}
    </div>
  )
}
