import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import Heart from './Heart'
import { Sheet } from './ui'
import { IconHandHeart, IconSparkle, IconChevronDown } from './icons'
import { timeAgo } from '../lib/format'

const PILARES = [
  { key: 'amor', label: 'Amor' },
  { key: 'relacion', label: 'Relación' },
  { key: 'pasion', label: 'Pasión' },
]
const NIVELES = {
  pleno: { label: 'Pleno', dot: 'bg-income', chip: 'bg-income-soft text-income' },
  bien: { label: 'Bien', dot: 'bg-primary', chip: 'bg-primary-soft text-primary-strong' },
  necesita_carino: { label: 'Necesita cariño', dot: 'bg-expense', chip: 'bg-expense-soft text-expense' },
}
const PILAR_LABEL = Object.fromEntries(PILARES.map((p) => [p.key, p.label]))

function PilarIcon({ pilar, className }) {
  if (pilar === 'amor') return <Heart variant="line" className={className} />
  if (pilar === 'relacion') return <IconHandHeart className={className} />
  return <IconSparkle className={className} />
}

export default function Pulso() {
  const { rows, add } = useRealtimeTable('pulso')
  const { profiles, me, profileFor } = useProfiles()
  const [sheet, setSheet] = useState(null)
  const [carino, setCarino] = useState(null) // pilar que quedó "necesita cariño"
  const [showHist, setShowHist] = useState(false)

  const actual = useMemo(() => {
    const map = {}
    const sorted = [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    for (const r of sorted) {
      map[r.pilar] = map[r.pilar] || {}
      map[r.pilar][r.registrado_por] = r
    }
    return map
  }, [rows])

  const historial = useMemo(
    () => [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 12),
    [rows]
  )

  const marcar = async (pilar, nivel, nota) => {
    setSheet(null)
    await add({ pilar, nivel, nota: nota || null, registrado_por: me?.id })
    if (nivel === 'necesita_carino') setCarino(pilar)
  }

  return (
    <section>
      <div className="mb-2.5 px-1">
        <h2 className="font-display text-xl font-medium tracking-tight">Cómo venimos</h2>
        <p className="text-sm text-muted">Marcá cómo sentís cada parte. Sin alarmas — es un pulso.</p>
      </div>

      <div className="space-y-3">
        {PILARES.map((pi) => (
          <div key={pi.key} className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
                <PilarIcon pilar={pi.key} className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-medium">{pi.label}</h3>
            </div>
            <div className="space-y-2">
              {profiles.map((p) => {
                const r = actual[pi.key]?.[p.id]
                const niv = r ? NIVELES[r.nivel] : null
                const isMe = p.id === me?.id
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm text-text">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.nombre}
                    </span>
                    {isMe ? (
                      <button onClick={() => setSheet({ pilar: pi.key })} className={`chip ${niv ? niv.chip : 'bg-surface-2 text-muted'}`}>
                        {niv ? niv.label : 'Marcar'} <IconChevronDown className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className={`chip ${niv ? niv.chip : 'bg-surface-2 text-soft'}`}>{niv ? niv.label : 'Sin marcar'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {historial.length > 0 ? (
        <div className="mt-3">
          <button onClick={() => setShowHist((s) => !s)} className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-muted">
            <span>Historial</span>
            <IconChevronDown className={`h-5 w-5 transition-transform ${showHist ? 'rotate-180' : ''}`} />
          </button>
          {showHist ? (
            <ul className="mt-1 space-y-2 animate-fade-up">
              {historial.map((r) => (
                <li key={r.id} className="flex items-center gap-2.5 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${NIVELES[r.nivel]?.dot}`} />
                  <span className="text-text">
                    {profileFor(r.registrado_por)?.nombre} · {PILAR_LABEL[r.pilar]}
                  </span>
                  <span className="text-muted">{NIVELES[r.nivel]?.label}</span>
                  <span className="ml-auto text-2xs text-soft">{timeAgo(r.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {sheet ? <PulsoSheet pilar={sheet.pilar} onClose={() => setSheet(null)} onMarcar={marcar} /> : null}
      {carino ? <CarinoPrompt pilar={carino} onClose={() => setCarino(null)} /> : null}
    </section>
  )
}

function PulsoSheet({ pilar, onClose, onMarcar }) {
  const [nivel, setNivel] = useState(null)
  const [nota, setNota] = useState('')
  return (
    <Sheet open onClose={onClose} title={`¿Cómo sentís ${PILAR_LABEL[pilar]?.toLowerCase()}?`}>
      <div className="space-y-3">
        {Object.entries(NIVELES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setNivel(k)}
            data-active={nivel === k}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3.5 text-left transition-colors data-[active=true]:border-primary/50 data-[active=true]:bg-primary-soft"
          >
            <span className={`h-3.5 w-3.5 rounded-full ${v.dot}`} />
            <span className="font-medium text-text">{v.label}</span>
          </button>
        ))}
        <textarea className="input" rows={2} placeholder="Una nota, si querés (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
        <button className="btn-primary w-full" disabled={!nivel} onClick={() => onMarcar(pilar, nivel, nota.trim())}>
          Guardar
        </button>
      </div>
    </Sheet>
  )
}

function CarinoPrompt({ pilar, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="alertdialog">
      <div className="absolute inset-0 bg-text/35 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-4xl bg-surface p-6 text-center shadow-lift animate-scale-in">
        <Heart variant="duo" className="mx-auto h-12 w-12" />
        <h3 className="mt-3 font-display text-xl font-medium">Gracias por contarlo</h3>
        <p className="mt-1.5 text-sm text-muted">
          {PILAR_LABEL[pilar]} necesita un poco de cariño. ¿Lo hablan ahora o lo llevan al encuentro?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button className="btn-primary" onClick={onClose}>Lo hablamos ahora</button>
          <button className="btn-ghost" onClick={onClose}>Lo llevamos al encuentro</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
