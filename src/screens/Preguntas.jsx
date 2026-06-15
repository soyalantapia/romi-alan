import { useMemo, useState } from 'react'
import { useJuego } from '../hooks/useJuego'
import { useProfiles } from '../context/ProfilesContext'
import { Segmented, EmptyState, Spinner } from '../components/ui'
import { IconSparkle, IconChevronRight, IconCheck, IconX } from '../components/icons'
import Heart from '../components/Heart'

const NIVEL = { 1: 'Liviana', 2: 'Personal', 3: 'Profunda' }

export default function Preguntas() {
  const { data, loading, marcar, siguiente, reactivar } = useJuego()
  const { profiles, profileFor } = useProfiles()
  const [vista, setVista] = useState('jugar')

  const coleccion = data?.coleccion || []
  const paraVolver = useMemo(
    () => coleccion.filter((q) => (q.marcas || []).some((m) => m.respondio === false)),
    [coleccion]
  )

  return (
    <div className="page">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Preguntas</h1>
          <p className="mt-0.5 text-sm text-muted">Una a la vez, para conocerse más. Por turnos.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>

      {loading && !data ? (
        <div className="flex justify-center py-12 text-soft">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <ProgresoBar prog={data?.progreso} />
          <div className="my-5">
            <Segmented
              value={vista}
              onChange={setVista}
              options={[
                { value: 'jugar', label: 'Jugar' },
                { value: 'coleccion', label: 'Colección', count: coleccion.length },
                { value: 'volver', label: 'Para volver', count: paraVolver.length },
              ]}
            />
          </div>

          {vista === 'jugar' ? (
            <Jugar actual={data?.actual} profiles={profiles} marcar={marcar} siguiente={siguiente} />
          ) : vista === 'coleccion' ? (
            <Lista items={coleccion} profileFor={profileFor} />
          ) : (
            <Lista items={paraVolver} profileFor={profileFor} reactivar={reactivar} />
          )}
        </>
      )}
    </div>
  )
}

function ProgresoBar({ prog }) {
  const p = prog || { respondidas: 0, pendientes: 0, porNivel: {} }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-text">{p.respondidas} jugadas</span>
        <span className="text-muted">{p.pendientes} por jugar</span>
      </div>
      <div className="mt-3 flex gap-2.5">
        {[1, 2, 3].map((n) => {
          const pn = p.porNivel?.[n] || { total: 0, respondidas: 0 }
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

function Jugar({ actual, profiles, marcar, siguiente }) {
  if (!actual) {
    return <EmptyState icon={IconSparkle} title="¡Jugaron todas!" hint="Pasaron por todo el banco de preguntas. Pueden volver a alguna desde “Para volver”." />
  }
  const marcaDe = (pid) => (actual.marcas || []).find((m) => m.respondido_por === pid)

  return (
    <div>
      {/* La pregunta, al medio */}
      <div className="card px-6 py-8 text-center">
        <span className="chip bg-accent-soft text-accent-strong">
          Nivel {actual.nivel} · {NIVEL[actual.nivel]}
        </span>
        <p className="mx-auto mt-4 max-w-[20rem] font-display text-2xl font-medium leading-snug tracking-tight">
          {actual.texto}
        </p>
      </div>

      {/* Turnos */}
      <div className="mt-5 space-y-3">
        {profiles.map((p) => {
          const m = marcaDe(p.id)
          return (
            <div key={p.id} className="card p-4">
              <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-text">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                Turno de {p.nombre}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => marcar(actual.id, p.id, true)}
                  data-active={m?.respondio === true}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-2 py-3 text-sm font-semibold text-muted transition-colors data-[active=true]:border-income/50 data-[active=true]:bg-income-soft data-[active=true]:text-income"
                >
                  <IconCheck className="h-4 w-4" strokeWidth={2.5} /> Respondí
                </button>
                <button
                  onClick={() => marcar(actual.id, p.id, false)}
                  data-active={m?.respondio === false}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-2 py-3 text-sm font-semibold text-muted transition-colors data-[active=true]:border-expense/50 data-[active=true]:bg-expense-soft data-[active=true]:text-expense"
                >
                  <IconX className="h-4 w-4" strokeWidth={2.5} /> No respondí
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {actual.resuelta ? (
        <button onClick={siguiente} className="btn-primary mt-4 w-full animate-fade-up">
          Siguiente pregunta <IconChevronRight className="h-5 w-5" />
        </button>
      ) : (
        <p className="mt-4 text-center text-sm text-soft">Cuando marquen los dos, aparece la siguiente.</p>
      )}
    </div>
  )
}

function Lista({ items, profileFor, reactivar }) {
  if (!items.length) {
    return reactivar ? (
      <EmptyState icon={IconCheck} title="Nada para volver" hint="Acá quedan las preguntas en las que alguno no estaba preparado, para retomarlas." />
    ) : (
      <EmptyState icon={IconSparkle} title="Todavía no jugaron ninguna" hint="Cuando los dos marquen una pregunta, queda registrada acá." />
    )
  }
  return (
    <div className="space-y-3">
      {items.map((q) => (
        <div key={q.id} className="card p-4">
          <span className="chip bg-accent-soft text-accent-strong">{NIVEL[q.nivel]}</span>
          <p className="mt-2 font-display text-lg font-medium leading-snug">{q.texto}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(q.marcas || []).map((m, i) => {
              const p = profileFor(m.por)
              return (
                <span
                  key={i}
                  className={`chip ${m.respondio ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'}`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p?.color || '#888' }} />
                  {p?.nombre || 'Alguien'}: {m.respondio ? 'respondió' : 'no estaba'}
                </span>
              )
            })}
          </div>
          {reactivar ? (
            <button onClick={() => reactivar(q.id)} className="btn-soft mt-3 w-full !py-2 text-sm">
              Volver a jugarla
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
