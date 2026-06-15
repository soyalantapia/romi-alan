import { useState } from 'react'
import { useJuego } from '../hooks/useJuego'
import { useProfiles } from '../context/ProfilesContext'
import { Segmented, EmptyState, Spinner } from './ui'
import { IconSparkle, IconChevronRight, IconCheck } from './icons'
import Heart from './Heart'

const NIVEL = { 1: 'Liviana', 2: 'Personal', 3: 'Profunda' }

export default function Preguntas() {
  const { data, loading, responder, saltear, siguiente, reactivar } = useJuego()
  const { profileFor } = useProfiles()
  const [vista, setVista] = useState('jugar')

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12 text-soft">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  const prog = data?.progreso || { respondidas: 0, salteadas: 0, pendientes: 0, porNivel: {} }

  return (
    <div>
      <ProgresoBar prog={prog} />
      <div className="my-5">
        <Segmented
          value={vista}
          onChange={setVista}
          options={[
            { value: 'jugar', label: 'Jugar' },
            { value: 'coleccion', label: 'Colección', count: prog.respondidas },
            { value: 'salteadas', label: 'Salteadas', count: prog.salteadas },
          ]}
        />
      </div>

      {vista === 'jugar' ? (
        <Jugar data={data} responder={responder} saltear={saltear} siguiente={siguiente} profileFor={profileFor} />
      ) : vista === 'coleccion' ? (
        <Coleccion items={data?.coleccion || []} profileFor={profileFor} />
      ) : (
        <Salteadas items={data?.salteadas || []} reactivar={reactivar} />
      )}
    </div>
  )
}

function ProgresoBar({ prog }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-text">{prog.respondidas} respondidas</span>
        <span className="text-muted">
          {prog.pendientes} pendientes · {prog.salteadas} salteadas
        </span>
      </div>
      <div className="mt-3 flex gap-2.5">
        {[1, 2, 3].map((n) => {
          const pn = prog.porNivel?.[n] || { total: 0, respondidas: 0 }
          const pct = pn.total ? Math.round((pn.respondidas / pn.total) * 100) : 0
          return (
            <div key={n} className="flex-1">
              <div className="mb-1 flex justify-between text-2xs text-soft">
                <span>{NIVEL[n]}</span>
                <span className="nums">
                  {pn.respondidas}/{pn.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Jugar({ data, responder, saltear, siguiente, profileFor }) {
  const { other } = useProfiles()
  const actual = data?.actual
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

  if (!actual) {
    return (
      <EmptyState icon={IconSparkle} title="¡Completaron todas!" hint="Respondieron todo el banco de preguntas. Pueden reactivar alguna salteada cuando quieran." />
    )
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!texto.trim()) return
    setSending(true)
    await responder(actual.id, texto.trim())
    setTexto('')
    setSending(false)
  }

  return (
    <div>
      <div className="card p-5">
        <span className="chip bg-accent-soft text-accent-strong">
          Nivel {actual.nivel} · {NIVEL[actual.nivel]}
        </span>
        <p className="mt-3 font-display text-2xl font-medium leading-snug tracking-tight">{actual.texto}</p>
      </div>

      {actual.resuelta ? (
        <div className="mt-4 animate-fade-up">
          <p className="mb-2 px-1 text-sm font-semibold text-muted">Las dos respuestas</p>
          <div className="space-y-3">
            {actual.respuestas.map((r, i) => (
              <RespuestaCard key={i} r={r} profileFor={profileFor} />
            ))}
          </div>
          <button onClick={siguiente} className="btn-primary mt-4 w-full">
            Siguiente pregunta <IconChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : actual.miRespuesta ? (
        <div className="card mt-4 p-5 text-center">
          <Heart variant="duo" className="mx-auto h-10 w-10 animate-heartbeat" />
          <p className="mt-2 font-display text-lg font-medium">Ya respondiste</p>
          <p className="text-sm text-muted">Esperando a que responda {other?.nombre || 'tu pareja'}…</p>
          <div className="mt-3 rounded-2xl bg-surface-2 p-3 text-left text-sm leading-relaxed text-text">
            {actual.miRespuesta}
          </div>
          <button onClick={() => saltear(actual.id)} className="mt-2 text-sm font-semibold text-muted hover:text-danger">
            No da · saltear
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-4">
          <textarea
            className="input"
            rows={4}
            autoFocus
            placeholder="Tu respuesta… (la ven recién cuando los dos respondieron)"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button className="btn-primary mt-3 w-full" disabled={sending || !texto.trim()}>
            {sending ? <Spinner /> : 'Responder'}
          </button>
          <button type="button" onClick={() => saltear(actual.id)} className="btn-ghost mt-2 w-full text-sm text-muted">
            No da · saltear
          </button>
        </form>
      )}
    </div>
  )
}

function RespuestaCard({ r, profileFor }) {
  const p = profileFor(r.por)
  const color = p?.color || '#8C8079'
  return (
    <div className="rounded-2xl border bg-surface p-4" style={{ borderColor: `${color}55` }}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-semibold" style={{ color }}>
          {p?.nombre || 'Alguien'}
        </span>
      </div>
      <p className="whitespace-pre-wrap leading-relaxed text-text">{r.texto}</p>
    </div>
  )
}

function Coleccion({ items, profileFor }) {
  const [nivel, setNivel] = useState(0)
  if (!items.length) {
    return <EmptyState icon={IconSparkle} title="Todavía no hay respuestas" hint="Cuando los dos respondan una pregunta, queda guardada acá como su colección." />
  }
  const filtered = nivel ? items.filter((i) => i.nivel === nivel) : items
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => setNivel(n)}
            data-active={nivel === n}
            className="chip border border-border bg-surface-2 data-[active=true]:border-primary/50 data-[active=true]:bg-primary-soft data-[active=true]:text-primary-strong"
          >
            {n === 0 ? 'Todas' : NIVEL[n]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((q) => (
          <div key={q.id} className="card p-4">
            <span className="chip bg-accent-soft text-accent-strong">{NIVEL[q.nivel]}</span>
            <p className="mt-2 font-display text-lg font-medium leading-snug">{q.texto}</p>
            <div className="mt-3 space-y-2.5">
              {q.respuestas.map((r, i) => (
                <RespuestaCard key={i} r={r} profileFor={profileFor} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Salteadas({ items, reactivar }) {
  if (!items.length) {
    return <EmptyState icon={IconCheck} title="Ninguna salteada" hint="Las preguntas que marquen “no da” quedan acá, y las pueden reactivar." />
  }
  return (
    <div className="space-y-2.5">
      {items.map((q) => (
        <div key={q.id} className="card flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-text">{q.texto}</p>
            <span className="text-2xs text-soft">{NIVEL[q.nivel]}</span>
          </div>
          <button onClick={() => reactivar(q.id)} className="btn-soft shrink-0 !px-3.5 !py-2 text-sm">
            Reactivar
          </button>
        </div>
      ))}
    </div>
  )
}
