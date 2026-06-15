import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useProfiles } from '../context/ProfilesContext'
import { useConfig } from '../context/ConfigContext'
import { api } from '../lib/api'
import { compressImage } from '../lib/image'
import { EmptyState, Spinner, ConfirmDialog } from './ui'
import { IconPlus, IconTrash, IconX, IconFoto } from './icons'
import { formatDate } from '../lib/format'

export default function Fotos() {
  const { rows, loading, add, remove } = useRealtimeTable('fotos')
  const { me } = useProfiles()
  const { get } = useConfig()
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [viewer, setViewer] = useState(null)
  const album = get('album_google_fotos', '')

  const onPick = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    for (const f of files) {
      try {
        const dataUrl = await compressImage(f)
        await add({ dataUrl, subido_por: me?.id })
      } catch {
        /* salteamos la que falle */
      }
    }
    setUploading(false)
  }

  const fotos = [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />

      <div className="mb-4 flex gap-2">
        <button onClick={() => fileRef.current?.click()} className="btn-primary flex-1" disabled={uploading}>
          {uploading ? <Spinner /> : <><IconPlus className="h-5 w-5" /> Subir foto</>}
        </button>
        {album ? (
          <a href={album} target="_blank" rel="noreferrer" className="btn-soft shrink-0">
            Álbum de Google
          </a>
        ) : null}
      </div>

      {fotos.length > 0 ? (
        <p className="mb-3 px-1 text-sm text-muted">
          {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
        </p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square" />
          ))}
        </div>
      ) : fotos.length === 0 ? (
        <EmptyState icon={IconFoto} title="Todavía no hay fotos" hint="Subí las primeras y van a quedar acá, para los dos.">
          <button onClick={() => fileRef.current?.click()} className="btn-soft">
            <IconPlus className="h-5 w-5" /> Subir foto
          </button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {fotos.map((f) => (
            <button
              key={f.id}
              onClick={() => setViewer(f)}
              className="aspect-square overflow-hidden rounded-xl bg-surface-2 transition-transform active:scale-95"
            >
              <img
                src={f._pending ? f.dataUrl : api.fotoUrl(f.id)}
                alt={f.descripcion || 'Foto'}
                loading="lazy"
                className={`h-full w-full object-cover ${f._pending ? 'opacity-60' : ''}`}
              />
            </button>
          ))}
        </div>
      )}

      {viewer ? (
        <FotoViewer
          foto={viewer}
          onClose={() => setViewer(null)}
          onDelete={() => {
            remove(viewer.id)
            setViewer(null)
          }}
        />
      ) : null}
    </div>
  )
}

function FotoViewer({ foto, onClose, onDelete }) {
  const { profileFor } = useProfiles()
  const [confirmDel, setConfirmDel] = useState(false)
  const p = profileFor(foto.subido_por)
  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 animate-fade-in">
      <div className="flex items-center justify-between p-4 text-white/90">
        <span className="text-sm">
          {p?.nombre || ''} · {formatDate(foto.created_at)}
        </span>
        <button onClick={onClose} className="icon-btn h-9 w-9 text-white/90 hover:bg-white/10" aria-label="Cerrar">
          <IconX className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden p-3" onClick={onClose}>
        <img
          src={foto._pending ? foto.dataUrl : api.fotoUrl(foto.id)}
          alt={foto.descripcion || 'Foto'}
          className="max-h-full max-w-full rounded-2xl object-contain"
        />
      </div>
      <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        {foto.descripcion ? <p className="mb-3 text-center text-white/90">{foto.descripcion}</p> : null}
        <button
          onClick={() => setConfirmDel(true)}
          className="mx-auto flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
        >
          <IconTrash className="h-5 w-5" /> Eliminar
        </button>
      </div>
      <ConfirmDialog
        open={confirmDel}
        title="¿Eliminar la foto?"
        onClose={() => setConfirmDel(false)}
        onConfirm={onDelete}
      />
    </div>,
    document.body
  )
}
