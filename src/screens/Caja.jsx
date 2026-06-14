import { useMemo, useState } from 'react'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import PersonTag from '../components/PersonTag'
import { EmptyState, SkeletonList, Sheet, ConfirmDialog, Segmented } from '../components/ui'
import { IconCaja, IconArrowUp, IconArrowDown, IconPlus, IconTrash } from '../components/icons'
import { formatMoney, formatSigned, formatDate, todayISO } from '../lib/format'

const CATEGORIAS = ['súper', 'servicios', 'salidas', 'casa', 'otros']

export default function Caja() {
  const { rows, loading, add, update, remove } = useRealtimeTable('movimientos')
  const { me, profiles } = useProfiles()
  const [sheet, setSheet] = useState(null) // { mode:'add' } | { mode:'edit', mov }

  const movimientos = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          new Date(b.fecha) - new Date(a.fecha) || new Date(b.created_at) - new Date(a.created_at)
      ),
    [rows]
  )

  const { saldo, aportado, gastado, porPersona } = useMemo(() => {
    let aportado = 0
    let gastado = 0
    const porPersona = {}
    for (const m of rows) {
      const monto = Number(m.monto) || 0
      if (m.tipo === 'aporte') {
        aportado += monto
        porPersona[m.registrado_por] = (porPersona[m.registrado_por] || 0) + monto
      } else {
        gastado += monto
      }
    }
    return { saldo: aportado - gastado, aportado, gastado, porPersona }
  }, [rows])

  return (
    <div className="page">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Caja</h1>
          <p className="mt-0.5 text-sm text-muted">La plata de la casa, clara para los dos.</p>
        </div>
        <button onClick={() => setSheet({ mode: 'add' })} className="btn-primary h-11 w-11 shrink-0 !px-0" aria-label="Cargar movimiento">
          <IconPlus className="h-5 w-5" />
        </button>
      </header>

      {/* Saldo */}
      <div className="card overflow-hidden p-6">
        <p className="text-sm font-medium text-muted">Saldo de la caja</p>
        <p className={`nums mt-1 font-display text-5xl font-medium tracking-tight ${saldo < 0 ? 'text-expense' : 'text-text'}`}>
          {formatMoney(saldo)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-income-soft px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wide text-income">Aportado</p>
            <p className="nums mt-0.5 font-display text-lg text-text">{formatMoney(aportado)}</p>
          </div>
          <div className="rounded-2xl bg-expense-soft px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wide text-expense">Gastado</p>
            <p className="nums mt-0.5 font-display text-lg text-text">{formatMoney(gastado)}</p>
          </div>
        </div>

        {profiles.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-muted">
                  {p.nombre} aportó <span className="nums font-semibold text-text">{formatMoney(porPersona[p.id] || 0)}</span>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Lista */}
      <div className="mt-6">
        {loading ? (
          <SkeletonList />
        ) : movimientos.length === 0 ? (
          <EmptyState icon={IconCaja} title="Todavía no hay movimientos" hint="Cargá el primer aporte o gasto y la caja empieza a tomar forma.">
            <button onClick={() => setSheet({ mode: 'add' })} className="btn-soft">
              <IconPlus className="h-5 w-5" /> Cargar movimiento
            </button>
          </EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {movimientos.map((m) => (
              <MovimientoItem key={m.id} mov={m} onClick={() => setSheet({ mode: 'edit', mov: m })} />
            ))}
          </ul>
        )}
      </div>

      {sheet ? (
        <MovimientoSheet
          key={sheet.mov?.id || 'add'}
          mode={sheet.mode}
          mov={sheet.mov}
          profiles={profiles}
          defaultPerson={me?.id}
          onClose={() => setSheet(null)}
          onAdd={(payload) => {
            add(payload)
            setSheet(null)
          }}
          onSave={(patch) => {
            update(sheet.mov.id, patch)
            setSheet(null)
          }}
          onDelete={() => {
            remove(sheet.mov.id)
            setSheet(null)
          }}
        />
      ) : null}
    </div>
  )
}

function MovimientoItem({ mov, onClick }) {
  const aporte = mov.tipo === 'aporte'
  return (
    <li>
      <button
        onClick={onClick}
        className={`card flex w-full items-center gap-3 p-3 text-left transition-shadow hover:shadow-soft-sm ${mov._pending ? 'opacity-60' : ''}`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            aporte ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'
          }`}
        >
          {aporte ? <IconArrowUp className="h-5 w-5" strokeWidth={2} /> : <IconArrowDown className="h-5 w-5" strokeWidth={2} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{mov.concepto || (aporte ? 'Aporte' : 'Gasto')}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {mov.categoria ? <span className="text-2xs font-semibold capitalize text-soft">{mov.categoria}</span> : null}
            <span className="text-2xs text-soft">{formatDate(mov.fecha)}</span>
            <PersonTag id={mov.registrado_por} />
          </div>
        </div>
        <span className={`nums shrink-0 font-display text-lg font-medium ${aporte ? 'text-income' : 'text-expense'}`}>
          {formatSigned(aporte ? Number(mov.monto) : -Number(mov.monto))}
        </span>
      </button>
    </li>
  )
}

function MovimientoSheet({ mode, mov, profiles, defaultPerson, onClose, onAdd, onSave, onDelete }) {
  const editing = mode === 'edit'
  const [tipo, setTipo] = useState(mov?.tipo || 'gasto')
  const [monto, setMonto] = useState(mov ? String(mov.monto).replace('.', ',') : '')
  const [concepto, setConcepto] = useState(mov?.concepto || '')
  const [categoria, setCategoria] = useState(mov?.categoria || '')
  const [fecha, setFecha] = useState(mov?.fecha?.slice(0, 10) || todayISO())
  const [quien, setQuien] = useState(mov?.registrado_por || defaultPerson || '')
  const [error, setError] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const valor = Number(String(monto).replace(/\./g, '').replace(',', '.'))
    if (!(valor > 0)) {
      setError('Poné un monto mayor a 0')
      return
    }
    const payload = {
      tipo,
      monto: valor,
      concepto: concepto.trim() || null,
      categoria: categoria || null,
      fecha,
      registrado_por: quien || undefined,
    }
    editing ? onSave(payload) : onAdd(payload)
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <form onSubmit={submit} className="space-y-4">
        <Segmented
          value={tipo}
          onChange={setTipo}
          options={[
            { value: 'gasto', label: 'Gasto' },
            { value: 'aporte', label: 'Aporte' },
          ]}
        />

        <div>
          <label className="field-label">Monto</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl text-soft">$</span>
            <input
              className="input nums pl-9 text-xl"
              inputMode="decimal"
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              autoFocus={!editing}
              required
            />
          </div>
        </div>

        <div>
          <label className="field-label">Concepto {tipo === 'gasto' ? <span className="text-soft">(recomendado)</span> : <span className="text-soft">(opcional)</span>}</label>
          <input className="input" placeholder={tipo === 'gasto' ? 'Súper, luz, salida…' : 'De dónde entra'} value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        </div>

        <div>
          <label className="field-label">Categoría</label>
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Fecha</label>
            <input type="date" className="input nums" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Quién</label>
            <div className="flex gap-2">
              {profiles.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setQuien(p.id)}
                  data-active={quien === p.id}
                  className="flex-1 rounded-2xl border border-border bg-surface-2 px-2 py-2.5 text-sm font-semibold text-muted transition-colors data-[active=true]:border-primary/50 data-[active=true]:bg-primary-soft data-[active=true]:text-primary-strong"
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button className="btn-primary w-full">{editing ? 'Guardar' : 'Cargar movimiento'}</button>
        {editing ? (
          <button type="button" onClick={() => setConfirmDel(true)} className="btn-danger w-full">
            <IconTrash className="h-5 w-5" /> Eliminar
          </button>
        ) : null}
      </form>

      <ConfirmDialog
        open={confirmDel}
        title="¿Eliminar el movimiento?"
        message={concepto || formatMoney(Number(String(monto).replace(/\./g, '').replace(',', '.')) || 0)}
        onClose={() => setConfirmDel(false)}
        onConfirm={onDelete}
      />
    </Sheet>
  )
}
