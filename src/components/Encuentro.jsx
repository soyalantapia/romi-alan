import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import PersonTag from './PersonTag'
import { Sheet, EmptyState } from './ui'
import { IconPlus, IconCheck, IconTrash, IconChevronDown, IconSparkle, IconHandHeart } from './icons'
import { formatDate, timeAgo, todayISO } from '../lib/format'

const recientes = (a, b) => new Date(b.created_at) - new Date(a.created_at)

export default function Encuentro() {
  const puntos = useRealtimeTable('puntos_trabajar')
  const momentos = useRealtimeTable('momentos')
  const encuentros = useRealtimeTable('encuentros')
  const { me } = useProfiles()
  const [flow, setFlow] = useState(false)
  const [showHist, setShowHist] = useState(false)

  const activos = useMemo(() => puntos.rows.filter((p) => p.estado === 'activo').sort(recientes), [puntos.rows])
  const buenos = useMemo(() => momentos.rows.filter((m) => m.tipo === 'momento').sort(recientes), [momentos.rows])
  const gracias = useMemo(() => momentos.rows.filter((m) => m.tipo === 'agradecimiento').sort(recientes), [momentos.rows])
  const hechos = useMemo(
    () => encuentros.rows.filter((e) => e.realizado).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
    [encuentros.rows]
  )

  return (
    <section className="space-y-7">
      {/* Lo bueno primero */}
      <div>
        <div className="mb-2.5 px-1">
          <h2 className="font-display text-xl font-medium tracking-tight">Lo bueno de la semana</h2>
          <p className="text-sm text-muted">Momentos lindos y gracias. Empezamos por acá.</p>
        </div>
        <MomentoAdd onAdd={(payload) => momentos.add({ ...payload, creado_por: me?.id })} />
        <div className="mt-3 space-y-2.5">
          {buenos.length === 0 && gracias.length === 0 ? (
            <p className="px-1 text-sm text-soft">Anotá un momento lindo o un “gracias por…”.</p>
          ) : (
            [...buenos, ...gracias].map((m) => (
              <ItemCard key={m.id} item={m} onDelete={() => momentos.remove(m.id)}>
                {m.tipo === 'agradecimiento' ? (
                  <span className="chip bg-primary-soft text-primary-strong">gracias</span>
                ) : (
                  <span className="chip bg-accent-soft text-accent-strong">momento</span>
                )}
              </ItemCard>
            ))
          )}
        </div>
      </div>

      {/* Para trabajar */}
      <div>
        <div className="mb-2.5 px-1">
          <h2 className="font-display text-xl font-medium tracking-tight">Para trabajar</h2>
          <p className="text-sm text-muted">En primera persona: en qué querés trabajar vos, o algo que te haría bien.</p>
        </div>
        <PuntoAdd onAdd={(payload) => puntos.add({ ...payload, creado_por: me?.id })} />
        <div className="mt-3 space-y-2.5">
          {activos.length === 0 ? (
            <p className="px-1 text-sm text-soft">Nada anotado. Cuando aparezca algo, sumalo y lo charlan en el encuentro.</p>
          ) : (
            activos.map((p) => (
              <ItemCard
                key={p.id}
                item={p}
                onCheck={() => puntos.update(p.id, { estado: 'logrado' })}
                onDelete={() => puntos.remove(p.id)}
              >
                <span className={`chip ${p.tipo === 'necesidad' ? 'bg-accent-soft text-accent-strong' : 'bg-primary-soft text-primary-strong'}`}>
                  {p.tipo === 'necesidad' ? 'me haría bien' : 'quiero trabajar'}
                </span>
              </ItemCard>
            ))
          )}
        </div>
      </div>

      {/* Iniciar el encuentro */}
      <button onClick={() => setFlow(true)} className="btn-primary w-full">
        <IconHandHeart className="h-5 w-5" /> Iniciar encuentro
      </button>

      {/* Historial */}
      {hechos.length > 0 ? (
        <div>
          <button onClick={() => setShowHist((s) => !s)} className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-muted">
            <span>Encuentros pasados · {hechos.length}</span>
            <IconChevronDown className={`h-5 w-5 transition-transform ${showHist ? 'rotate-180' : ''}`} />
          </button>
          {showHist ? (
            <div className="mt-1 space-y-3 animate-fade-up">
              {hechos.map((e) => (
                <div key={e.id} className="card p-4">
                  <p className="font-display text-base font-medium">{formatDate(e.fecha)}</p>
                  {e.acuerdos ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{e.acuerdos}</p>
                  ) : (
                    <p className="mt-1 text-sm text-soft">Sin acuerdos anotados.</p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {flow ? (
        <EncuentroFlow
          buenos={buenos}
          gracias={gracias}
          activos={activos}
          onClose={() => setFlow(false)}
          onFinish={(acuerdos) => {
            encuentros.add({ realizado: true, acuerdos: acuerdos || null, fecha: todayISO() })
            setFlow(false)
          }}
        />
      ) : null}
    </section>
  )
}

function ItemCard({ item, children, onCheck, onDelete }) {
  return (
    <div className={`card flex items-start gap-3 p-3.5 ${item._pending ? 'opacity-60' : ''}`}>
      {onCheck ? (
        <button
          onClick={onCheck}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-border text-transparent transition-colors hover:border-accent"
          aria-label="Marcar logrado"
        >
          <IconCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-text">{item.texto}</p>
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

const PASOS = [
  { key: 'momentos', titulo: 'Lo bueno de la semana', sub: 'Recordemos los momentos lindos.' },
  { key: 'gracias', titulo: 'Agradecimientos', sub: 'Lo que le agradecemos al otro.' },
  { key: 'puntos', titulo: 'Para trabajar', sub: 'Lo que cada uno quiere mejorar.' },
  { key: 'acuerdos', titulo: 'Acuerdos', sub: '¿Qué vamos a intentar esta semana?' },
]

function EncuentroFlow({ buenos, gracias, activos, onClose, onFinish }) {
  const [paso, setPaso] = useState(0)
  const [acuerdos, setAcuerdos] = useState('')
  const p = PASOS[paso]
  const lista = p.key === 'momentos' ? buenos : p.key === 'gracias' ? gracias : p.key === 'puntos' ? activos : []

  return (
    <Sheet open onClose={onClose} title="Encuentro">
      <div className="mb-4 flex gap-1.5">
        {PASOS.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= paso ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>

      <h3 className="font-display text-2xl font-medium tracking-tight">{p.titulo}</h3>
      <p className="mt-0.5 text-sm text-muted">{p.sub}</p>

      <div className="mt-4 min-h-[8rem] space-y-2.5">
        {p.key === 'acuerdos' ? (
          <textarea
            className="input"
            rows={5}
            autoFocus
            placeholder="Esta semana vamos a intentar…"
            value={acuerdos}
            onChange={(e) => setAcuerdos(e.target.value)}
          />
        ) : lista.length === 0 ? (
          <p className="py-4 text-center text-sm text-soft">Nada anotado en esta parte.</p>
        ) : (
          lista.map((it) => (
            <div key={it.id} className="rounded-2xl bg-surface-2 p-3">
              <p className="text-sm text-text">{it.texto}</p>
              <div className="mt-1.5">
                <PersonTag id={it.creado_por} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5 flex gap-2">
        {paso > 0 ? (
          <button onClick={() => setPaso((s) => s - 1)} className="btn-ghost flex-1">
            Atrás
          </button>
        ) : null}
        {paso < PASOS.length - 1 ? (
          <button onClick={() => setPaso((s) => s + 1)} className="btn-primary flex-1">
            Siguiente
          </button>
        ) : (
          <button onClick={() => onFinish(acuerdos.trim())} className="btn-primary flex-1">
            <IconCheck className="h-5 w-5" /> Terminar
          </button>
        )}
      </div>
    </Sheet>
  )
}
