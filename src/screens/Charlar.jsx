import { useEffect, useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import PersonTag from '../components/PersonTag'
import { Segmented, EmptyState, SkeletonList, Sheet, ConfirmDialog, Toggle } from '../components/ui'
import { IconCharlar, IconCheck, IconEdit, IconTrash, IconChevronDown, IconPlus } from '../components/icons'
import { timeAgo } from '../lib/format'

export default function Charlar() {
  const { rows, loading, add, update, remove } = useRealtimeTable('temas')
  const { me } = useProfiles()
  const [tab, setTab] = useState('pendiente')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const pendientes = useMemo(
    () =>
      rows
        .filter((t) => t.estado === 'pendiente')
        .sort((a, b) => {
          const pa = a.prioridad === 'importante' ? 0 : 1
          const pb = b.prioridad === 'importante' ? 0 : 1
          if (pa !== pb) return pa - pb
          return new Date(b.created_at) - new Date(a.created_at)
        }),
    [rows]
  )
  const hablados = useMemo(
    () =>
      rows
        .filter((t) => t.estado === 'hablado')
        .sort((a, b) => new Date(b.hablado_at || b.created_at) - new Date(a.hablado_at || a.created_at)),
    [rows]
  )

  const list = tab === 'pendiente' ? pendientes : hablados

  return (
    <div className="page">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-medium tracking-tight">Charlar</h1>
        <p className="mt-0.5 text-sm text-muted">Temas para hablar tranquilos, sin que explote todo de noche.</p>
      </header>

      <QuickAdd onAdd={(payload) => add({ ...payload, creado_por: me?.id })} />

      <div className="mb-4 mt-6">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'pendiente', label: 'Pendientes', count: pendientes.length },
            { value: 'hablado', label: 'Hablados', count: hablados.length },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonList />
      ) : list.length === 0 ? (
        tab === 'pendiente' ? (
          <EmptyState
            icon={IconCharlar}
            title="No hay temas para hablar"
            hint="Todo al día. Cuando aparezca algo, anotalo acá y lo charlan con calma."
          />
        ) : (
          <EmptyState icon={IconCheck} title="Todavía no hablaron nada" hint="Los temas que marquen como hablados van a quedar guardados acá." />
        )
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <TemaCard
              key={t.id}
              tema={t}
              onToggle={() =>
                update(t.id, { estado: t.estado === 'pendiente' ? 'hablado' : 'pendiente' })
              }
              onEdit={() => setEditing(t)}
              onDelete={() => setConfirm(t)}
            />
          ))}
        </ul>
      )}

      <EditSheet
        tema={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          update(editing.id, patch)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar el tema?"
        message={confirm?.titulo}
        onClose={() => setConfirm(null)}
        onConfirm={() => remove(confirm.id)}
      />
    </div>
  )
}

function QuickAdd({ onAdd }) {
  const [titulo, setTitulo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [importante, setImportante] = useState(false)
  const [open, setOpen] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const t = titulo.trim()
    if (!t) return
    onAdd({ titulo: t, detalle: detalle.trim() || null, prioridad: importante ? 'importante' : 'normal' })
    setTitulo('')
    setDetalle('')
    setImportante(false)
    setOpen(false)
  }

  return (
    <form onSubmit={submit} className="card p-2.5">
      <div className="flex items-center gap-2">
        <input
          className="input border-transparent bg-transparent focus:bg-transparent"
          placeholder="¿Qué quieren hablar?"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          aria-label="Nuevo tema"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`icon-btn h-10 w-10 shrink-0 ${open ? 'text-primary-strong' : ''}`}
          aria-label="Más opciones"
        >
          <IconChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button type="submit" className="btn-primary h-10 w-10 shrink-0 !px-0" aria-label="Agregar tema">
          <IconPlus className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div className="space-y-3 px-1.5 pb-1.5 pt-3 animate-fade-up">
          <textarea
            className="input"
            rows={2}
            placeholder="Detalle o contexto (opcional)"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
          />
          <Toggle checked={importante} onChange={setImportante} label="Marcar como importante" />
        </div>
      ) : null}
    </form>
  )
}

function TemaCard({ tema, onToggle, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const hablado = tema.estado === 'hablado'
  return (
    <li className={`card p-4 ${tema._pending ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
            hablado ? 'border-accent-strong bg-accent-strong text-white' : 'border-border text-transparent hover:border-accent'
          }`}
          aria-label={hablado ? 'Marcar como pendiente' : 'Marcar como hablado'}
        >
          <IconCheck className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <div className="min-w-0 flex-1">
          <p className={`font-medium leading-snug ${hablado ? 'text-muted line-through' : 'text-text'}`}>
            {tema.titulo}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {tema.prioridad === 'importante' && !hablado ? (
              <span className="chip bg-primary-soft text-primary-strong">Importante</span>
            ) : null}
            <PersonTag id={tema.creado_por} suffix={timeAgo(tema.created_at)} />
          </div>

          {tema.detalle ? (
            <>
              {expanded ? (
                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{tema.detalle}</p>
              ) : null}
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-1.5 text-xs font-semibold text-primary-strong"
              >
                {expanded ? 'Ocultar detalle' : 'Ver detalle'}
              </button>
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button onClick={onEdit} className="icon-btn h-8 w-8" aria-label="Editar">
            <IconEdit className="h-[1.05rem] w-[1.05rem]" />
          </button>
          <button onClick={onDelete} className="icon-btn h-8 w-8 hover:text-danger" aria-label="Eliminar">
            <IconTrash className="h-[1.05rem] w-[1.05rem]" />
          </button>
        </div>
      </div>
    </li>
  )
}

function EditSheet({ tema, onClose, onSave }) {
  const [titulo, setTitulo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [importante, setImportante] = useState(false)

  // sincronizar al abrir
  useEffect(() => {
    if (tema) {
      setTitulo(tema.titulo || '')
      setDetalle(tema.detalle || '')
      setImportante(tema.prioridad === 'importante')
    }
  }, [tema])

  const save = (e) => {
    e.preventDefault()
    if (!titulo.trim()) return
    onSave({ titulo: titulo.trim(), detalle: detalle.trim() || null, prioridad: importante ? 'importante' : 'normal' })
  }

  return (
    <Sheet open={!!tema} onClose={onClose} title="Editar tema">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="field-label">Tema</label>
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">Detalle</label>
          <textarea className="input" rows={3} value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Opcional" />
        </div>
        <Toggle checked={importante} onChange={setImportante} label="Importante" />
        <button className="btn-primary w-full">Guardar</button>
      </form>
    </Sheet>
  )
}
