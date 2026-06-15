import { useNavigate } from 'react-router-dom'
import Heart from '../components/Heart'
import { IconHandHeart, IconCalendar, IconFoto, IconSparkle, IconChevronRight } from '../components/icons'

const SECCIONES = [
  { to: '/conexion', Icon: IconHandHeart, title: 'Conexión', desc: 'El pulso de la relación, sin alarmas.' },
  { to: '/encuentro', Icon: IconCalendar, title: 'Encuentro', desc: 'Su ratito de la semana, guardado.' },
  { to: '/fotos', Icon: IconFoto, title: 'Fotos', desc: 'Nuestra galería compartida.' },
  { to: '/preguntas', Icon: IconSparkle, title: 'Preguntas', desc: 'Un juego para conocerse más, por turnos.' },
]

// Nosotros = el hub de las cosas de la pareja, cada una en su sección.
export default function Nosotros() {
  const navigate = useNavigate()
  return (
    <div className="page">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Nosotros</h1>
          <p className="mt-0.5 text-sm text-muted">Nuestro espacio de pareja.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>

      <div className="space-y-3">
        {SECCIONES.map((s) => (
          <button
            key={s.to}
            onClick={() => navigate(s.to)}
            className="card flex w-full items-center gap-4 p-5 text-left transition-all duration-200 ease-gentle hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.99]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-strong">
              <s.Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-medium leading-tight">{s.title}</p>
              <p className="mt-0.5 text-sm text-muted">{s.desc}</p>
            </div>
            <IconChevronRight className="h-5 w-5 shrink-0 text-soft" />
          </button>
        ))}
      </div>
    </div>
  )
}
