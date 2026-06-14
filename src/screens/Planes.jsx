import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import PersonTag from '../components/PersonTag'
import { EmptyState, SkeletonList, Sheet, ConfirmDialog, Toggle } from '../components/ui'
import {
  IconPlanes,
  IconCheck,
  IconEdit,
  IconTrash,
  IconPlus,
  IconChevronDown,
  IconMapPin,
  IconSparkle,
  IconCalendar,
} from '../components/icons'
import { formatDayMonth, countdownLabel, daysUntil, todayISO } from '../lib/format'

const CATEGORIAS = [
  { value: 'lugar', label: 'Lugar', Icon: IconMapPin },
  { value: 'actividad', label: 'Actividad', Icon: IconSparkle },
  { value: 'fecha_importante', label: 'Fecha', Icon: IconCalendar },
  { value: 'otro', label: 'Otro', Icon: IconPlanes },
]
const catIcon = (c) => (CATEGORIAS.find((x) => x.value === c) || CATEGORIAS[3]).Icon

export default function Planes() {
  const { rows, loading, add, update, remove } = useRealtimeTable('planes')
  const { me } = useProfiles()
  const [sheet, setSheet] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [showHechos, setShowHechos] = useState(false)

  const conFecha = useMemo(
    () =>
      rows
        .filter((p) => p.estado === 'pendiente' && p.fecha)
        .sort((a, b) => {
          const da = daysUntil(a.fecha)
          const db = daysUntil(b.fecha)
          const ka = da >= 0 ? [0, da] : [1, -da]
          const kb = db >= 0 ? [0, db] : [1, -db]
          return ka[0] - kb[0] || ka[1] - kb[1]
        }),
    [rows]
  )
  const algunDia = useMemo(
    () =>
      rows
        .filter((p) => p.estado === 'pendiente' && !p.fecha)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [rows]
  )
  const hechos = useMemo(
    () =>
      rows
        .filter((p) => p.estado === 'hecho')
        .sort((a, b) => new Date(b.hecho_at || 0) - new Date(a.hecho_at || 0)),
    [rows]
  )

  const vacioTotal = !loading && rows.length === 0

  return (
    <div className="page">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Planes</h1>
          <p className="mt-0.5 text-sm text-muted">Lo que queremos hacer juntos y las fechas que importan.</p>
        </div>
        <button onClick={() => setSheet({ mode: 'add' })} className="btn-primary h-11 w-11 shrink-0 !px-0" aria-label="Nuevo plan">
          <IconPlus className="h-5 w-5" />
        </button>
      </header>

      {loading ? (
        <SkeletonList />
      ) : vacioTotal ? (
        <EmptyState icon={IconSparkle} title="Sueñen algo lindo" hint="Un lugar para ir, un curso, una fecha que no quieren olvidar. Empiecen por uno.">
          <button onClick={() => setSheet({ mode: 'add' })} className="btn-soft">
            <IconPlus className="h-5 w-5" /> Agregar plan
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-7">
          {conFecha.length > 0 ? (
            <Section title="Con fecha">
              {conFecha.map((p) => (
                <PlanCard key={p.id} plan={p} onDone={() => update(p.id, { estado: 'hecho' })} onEdit={() => setSheet({ mode: 'edit', plan: p })} onDelete={() => setConfirm(p)} />
              ))}
            </Section>
          ) : null}

          {algunDia.length > 0 ? (
            <Section title="Algún día">
              {algunDia.map((p) => (
                <PlanCard key={p.id} plan={p} onDone={() => update(p.id, { estado: 'hecho' })} onEdit={() => setSheet({ mode: 'edit', plan: p })} onDelete={() => setConfirm(p)} />
              ))}
            </Section>
          ) : null}

          {hechos.length > 0 ? (
            <div>
              <button onClick={() => setShowHechos((s) => !s)} className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-muted">
                <span>Hechos · {hechos.length}</span>
                <IconChevronDown className={`h-5 w-5 transition-transform ${showHechos ? 'rotate-180' : ''}`} />
              </button>
              {showHechos ? (
                <div className="mt-1 space-y-3 animate-fade-up">
                  {hechos.map((p) => (
                    <PlanCard key={p.id} plan={p} done onDone={() => update(p.id, { estado: 'pendiente' })} onEdit={() => setSheet({ mode: 'edit', plan: p })} onDelete={() => setConfirm(p)} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {sheet ? (
        <PlanSheet
          key={sheet.plan?.id || 'add'}
          mode={sheet.mode}
          plan={sheet.plan}
          onClose={() => setSheet(null)}
          onAdd={(payload) => {
            add({ ...payload, creado_por: me?.id })
            setSheet(null)
          }}
          onSave={(patch) => {
            update(sheet.plan.id, patch)
            setSheet(null)
          }}
        />
      ) : null}

      <ConfirmDialog open={!!confirm} title="¿Eliminar el plan?" message={confirm?.titulo} onClose={() => setConfirm(null)} onConfirm={() => remove(confirm.id)} />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-2.5 px-1 text-sm font-semibold uppercase tracking-wide text-soft">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function PlanCard({ plan, done, onDone, onEdit, onDelete }) {
  const Icon = catIcon(plan.categoria)
  const cd = plan.fecha ? countdownLabel(plan.fecha) : null
  const soon = plan.fecha ? daysUntil(plan.fecha) : null
  const urgente = soon !== null && soon >= 0 && soon <= 3
  return (
    <div className={`card p-4 ${plan._pending ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${done ? 'bg-surface-2 text-soft' : 'bg-accent-soft text-accent-strong'}`}>
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className={`font-medium leading-snug ${done ? 'text-muted line-through' : 'text-text'}`}>{plan.titulo}</p>
          {plan.detalle ? <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{plan.detalle}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {plan.fecha && !done ? (
              <span className={`chip ${urgente ? 'bg-primary-soft text-primary-strong' : 'bg-accent-soft text-accent-strong'}`}>
                {formatDayMonth(plan.fecha)} · {cd}
              </span>
            ) : null}
            <PersonTag id={plan.creado_por} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <button
            onClick={onDone}
            className={`grid h-8 w-8 place-items-center rounded-full border-2 transition-colors ${
              done ? 'border-accent-strong bg-accent-strong text-white' : 'border-border text-transparent hover:border-accent'
            }`}
            aria-label={done ? 'Volver a pendiente' : 'Marcar como hecho'}
          >
            <IconCheck className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button onClick={onEdit} className="icon-btn h-8 w-8" aria-label="Editar">
            <IconEdit className="h-[1.05rem] w-[1.05rem]" />
          </button>
          <button onClick={onDelete} className="icon-btn h-8 w-8 hover:text-danger" aria-label="Eliminar">
            <IconTrash className="h-[1.05rem] w-[1.05rem]" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PlanSheet({ mode, plan, onClose, onAdd, onSave }) {
  const editing = mode === 'edit'
  const [titulo, setTitulo] = useState(plan?.titulo || '')
  const [categoria, setCategoria] = useState(plan?.categoria || 'actividad')
  const [detalle, setDetalle] = useState(plan?.detalle || '')
  const [conFecha, setConFecha] = useState(!!plan?.fecha)
  const [fecha, setFecha] = useState(plan?.fecha?.slice(0, 10) || todayISO())
  const [recordar, setRecordar] = useState(plan?.recordar ?? true)
  const [diasAntes, setDiasAntes] = useState(plan?.dias_antes ?? 3)

  const submit = (e) => {
    e.preventDefault()
    if (!titulo.trim()) return
    const payload = {
      titulo: titulo.trim(),
      categoria,
      detalle: detalle.trim() || null,
      fecha: conFecha ? fecha : null,
      recordar: conFecha ? recordar : false,
      dias_antes: diasAntes,
    }
    editing ? onSave(payload) : onAdd(payload)
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar plan' : 'Nuevo plan'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label">¿Qué quieren hacer?</label>
          <input className="input" placeholder="Ir a Bariloche, curso de cerámica, aniversario…" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus={!editing} required />
        </div>

        <div>
          <label className="field-label">Tipo</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIAS.map(({ value, label, Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setCategoria(value)}
                data-active={categoria === value}
                className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-surface-2 py-2.5 text-2xs font-semibold text-muted transition-colors data-[active=true]:border-primary/50 data-[active=true]:bg-primary-soft data-[active=true]:text-primary-strong"
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Detalle</label>
          <textarea className="input" rows={2} placeholder="Opcional" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        </div>

        <div className="rounded-2xl bg-surface-2 p-3">
          <Toggle checked={conFecha} onChange={setConFecha} label="Tiene fecha" />
          {conFecha ? (
            <div className="mt-3 space-y-3 animate-fade-up">
              <input type="date" className="input nums bg-surface" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <Toggle checked={recordar} onChange={setRecordar} label="Recordármelo en Inicio" />
              {recordar ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>Avisar</span>
                  <select className="input w-auto bg-surface px-3 py-1.5" value={diasAntes} onChange={(e) => setDiasAntes(Number(e.target.value))}>
                    <option value={1}>1 día antes</option>
                    <option value={3}>3 días antes</option>
                    <option value={7}>1 semana antes</option>
                  </select>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-soft">Sin fecha va al bolsón “Algún día”.</p>
          )}
        </div>

        <button className="btn-primary w-full">{editing ? 'Guardar' : 'Agregar plan'}</button>
      </form>
    </Sheet>
  )
}
