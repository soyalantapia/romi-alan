import { useProfiles } from '../context/ProfilesContext'

const FALLBACK = '#8C8079'

/** Etiqueta "quién" — punto con el color de la persona + nombre. */
export default function PersonTag({ id, suffix }) {
  const { profileFor } = useProfiles()
  const p = profileFor(id)
  const name = p?.nombre || 'Alguien'
  const color = p?.color || FALLBACK
  return (
    <span
      className="chip text-text/90"
      style={{ backgroundColor: `${color}22` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
      {suffix ? <span className="font-normal text-muted">· {suffix}</span> : null}
    </span>
  )
}

/** Inicial en círculo con el color de la persona. */
export function PersonAvatar({ id, size = 'md', className = '' }) {
  const { profileFor } = useProfiles()
  const p = profileFor(id)
  const name = p?.nombre || '?'
  const color = p?.color || FALLBACK
  const dims = size === 'lg' ? 'h-11 w-11 text-lg' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-display font-semibold ${dims} ${className}`}
      style={{ backgroundColor: `${color}26`, color }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
