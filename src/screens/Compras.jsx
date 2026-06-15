import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import PersonTag from '../components/PersonTag'
import { EmptyState, SkeletonList, ConfirmDialog } from '../components/ui'
import { IconCompras, IconCheck, IconTrash, IconPlus, IconChevronDown } from '../components/icons'

const CATEGORIAS = ['comida', 'limpieza', 'bebidas', 'farmacia', 'casa', 'otros']

export default function Compras() {
  const { rows, loading, add, update, remove } = useRealtimeTable('compras')
  const { me } = useProfiles()
  const [showComprados, setShowComprados] = useState(false)
  const [confirmVaciar, setConfirmVaciar] = useState(false)

  const pendientes = useMemo(
    () => rows.filter((c) => !c.comprado).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [rows]
  )
  const comprados = useMemo(
    () => rows.filter((c) => c.comprado).sort((a, b) => new Date(b.comprado_at || 0) - new Date(a.comprado_at || 0)),
    [rows]
  )

  const vaciar = () => comprados.forEach((c) => remove(c.id))

  return (
    <div>
      <QuickAdd onAdd={(payload) => add({ ...payload, creado_por: me?.id })} />

      <div className="mt-6">
        {loading ? (
          <SkeletonList />
        ) : pendientes.length === 0 ? (
          <EmptyState icon={IconCompras} title="Lista limpia" hint="No falta nada. Cuando se acabe algo, sumalo arriba y aparece en los dos teléfonos." />
        ) : (
          <ul className="space-y-2.5">
            {pendientes.map((c) => (
              <CompraItem key={c.id} compra={c} onToggle={() => update(c.id, { comprado: true })} onDelete={() => remove(c.id)} />
            ))}
          </ul>
        )}
      </div>

      {comprados.length > 0 ? (
        <div className="mt-7">
          <button
            onClick={() => setShowComprados((s) => !s)}
            className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-muted"
          >
            <span>Comprados · {comprados.length}</span>
            <IconChevronDown className={`h-5 w-5 transition-transform ${showComprados ? 'rotate-180' : ''}`} />
          </button>
          {showComprados ? (
            <div className="animate-fade-up">
              <ul className="mt-1 space-y-2.5">
                {comprados.map((c) => (
                  <CompraItem key={c.id} compra={c} onToggle={() => update(c.id, { comprado: false })} onDelete={() => remove(c.id)} />
                ))}
              </ul>
              <button onClick={() => setConfirmVaciar(true)} className="btn-ghost mt-3 w-full text-sm text-danger hover:bg-danger/10">
                Vaciar comprados
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmVaciar}
        title="¿Vaciar comprados?"
        message={`Se borran ${comprados.length} ${comprados.length === 1 ? 'ítem' : 'ítems'} de la lista.`}
        confirmLabel="Vaciar"
        onClose={() => setConfirmVaciar(false)}
        onConfirm={vaciar}
      />
    </div>
  )
}

function QuickAdd({ onAdd }) {
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [categoria, setCategoria] = useState('')
  const [open, setOpen] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return
    onAdd({ nombre: n, cantidad: cantidad.trim() || null, categoria: categoria || null })
    setNombre('')
    setCantidad('')
    // mantenemos categoría/expand para cargar varios seguidos
  }

  return (
    <form onSubmit={submit} className="card p-2.5">
      <div className="flex items-center gap-2">
        <input
          className="input border-transparent bg-transparent focus:bg-transparent"
          placeholder="Agregar a la lista…"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          aria-label="Nuevo ítem"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`icon-btn h-10 w-10 shrink-0 ${open ? 'text-primary-strong' : ''}`}
          aria-label="Más opciones"
        >
          <IconChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button type="submit" className="btn-primary h-10 w-10 shrink-0 !px-0" aria-label="Agregar">
          <IconPlus className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div className="space-y-3 px-1.5 pb-1.5 pt-3 animate-fade-up">
          <input className="input" placeholder="Cantidad (ej. 2, 1 docena)" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoria((c) => (c === cat ? '' : cat))}
                data-active={categoria === cat}
                className="chip border border-border bg-surface-2 capitalize data-[active=true]:border-primary/50 data-[active=true]:bg-primary-soft data-[active=true]:text-primary-strong"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  )
}

function CompraItem({ compra, onToggle, onDelete }) {
  const done = compra.comprado
  return (
    <li className={`card flex items-center gap-3 p-3 ${compra._pending ? 'opacity-60' : ''}`}>
      <button
        onClick={onToggle}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          done ? 'border-accent-strong bg-accent-strong text-white animate-check-pop' : 'border-border text-transparent hover:border-accent'
        }`}
        aria-label={done ? 'Desmarcar' : 'Marcar como comprado'}
      >
        <IconCheck className="h-4 w-4" strokeWidth={2.5} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`truncate font-medium ${done ? 'text-muted line-through' : 'text-text'}`}>{compra.nombre}</span>
          {compra.cantidad ? <span className="shrink-0 text-sm text-soft">{compra.cantidad}</span> : null}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {compra.categoria ? <span className="text-2xs font-semibold capitalize text-soft">{compra.categoria}</span> : null}
          <PersonTag id={compra.creado_por} />
        </div>
      </div>

      <button onClick={onDelete} className="icon-btn h-8 w-8 shrink-0 hover:text-danger" aria-label="Eliminar">
        <IconTrash className="h-[1.05rem] w-[1.05rem]" />
      </button>
    </li>
  )
}
