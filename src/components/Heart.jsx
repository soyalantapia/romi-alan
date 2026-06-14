import { useId } from 'react'

// Corazón hecho a medida — el signature de la marca.
// Dos lóbulos que se funden: izquierda el color de Romi, derecha el de Alan,
// con una mezcla suave en el centro (los dos, una sola cosa).
const HEART_PATH =
  'M50 86.5 C 50 86.5, 13 62 13 36.2 C 13 22.6 23.4 14.5 34.2 14.5 ' +
  'C 42.6 14.5 47.7 20.4 50 26 C 52.3 20.4 57.4 14.5 65.8 14.5 ' +
  'C 76.6 14.5 87 22.6 87 36.2 C 87 62 50 86.5 50 86.5 Z'

/**
 * variant:
 *  - 'duo'   gradiente Romi→Alan (marca)
 *  - 'line'  contorno fino (currentColor)
 *  - 'solid' relleno (currentColor)
 *  - 'soft'  relleno tenue + contorno
 */
export default function Heart({ variant = 'duo', strokeWidth = 5, className = '', title }) {
  const id = useId().replace(/:/g, '')
  const gradId = `romi-alan-grad-${id}`

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      {variant === 'duo' && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0.2" x2="1" y2="0.85">
            <stop offset="0%" stopColor="rgb(var(--c-romi))" />
            <stop offset="40%" stopColor="rgb(var(--c-romi))" />
            <stop offset="60%" stopColor="rgb(var(--c-alan))" />
            <stop offset="100%" stopColor="rgb(var(--c-alan))" />
          </linearGradient>
        </defs>
      )}

      {variant === 'duo' && <path d={HEART_PATH} fill={`url(#${gradId})`} />}
      {variant === 'solid' && <path d={HEART_PATH} fill="currentColor" />}
      {variant === 'soft' && (
        <path
          d={HEART_PATH}
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
      {variant === 'line' && (
        <path
          d={HEART_PATH}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export { HEART_PATH }
