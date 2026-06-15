import Pulso from '../components/Pulso'
import Heart from '../components/Heart'

// Conexión = el pulso de la relación (cómo viene cada pilar).
export default function Conexion() {
  return (
    <div className="page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Conexión</h1>
          <p className="mt-0.5 text-sm text-muted">El pulso de la relación, sin alarmas.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>
      <Pulso />
    </div>
  )
}
