import Galeria from '../components/Fotos'
import Heart from '../components/Heart'

export default function Fotos() {
  return (
    <div className="page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Fotos</h1>
          <p className="mt-0.5 text-sm text-muted">Nuestra galería, para los dos.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>
      <Galeria />
    </div>
  )
}
