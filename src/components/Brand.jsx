import Heart from './Heart'

const SIZES = {
  sm: { heart: 'h-5 w-5', text: 'text-base' },
  md: { heart: 'h-7 w-7', text: 'text-xl' },
  lg: { heart: 'h-11 w-11', text: 'text-3xl' },
}

// Logotipo de la marca: el corazón duo + "Romi & Alan" en la tipografía display.
export default function Brand({ size = 'md', className = '', stacked = false }) {
  const s = SIZES[size] || SIZES.md
  if (stacked) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <Heart variant="duo" className={`${s.heart} animate-heartbeat`} title="Romi & Alan" />
        <span className={`font-display ${s.text} font-medium tracking-tight text-text`}>
          Romi <span className="text-primary">&</span> Alan
        </span>
      </div>
    )
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Heart variant="duo" className={s.heart} title="Romi & Alan" />
      <span className={`font-display ${s.text} font-medium tracking-tight text-text`}>
        Romi <span className="text-primary">&</span> Alan
      </span>
    </span>
  )
}
