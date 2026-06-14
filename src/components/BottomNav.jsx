import { NavLink } from 'react-router-dom'
import { IconInicio, IconCharlar, IconCompras, IconCaja, IconPlanes } from './icons'

const TABS = [
  { to: '/', label: 'Inicio', Icon: IconInicio, end: true },
  { to: '/charlar', label: 'Charlar', Icon: IconCharlar },
  { to: '/compras', label: 'Compras', Icon: IconCompras },
  { to: '/caja', label: 'Caja', Icon: IconCaja },
  { to: '/planes', label: 'Planes', Icon: IconPlanes },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navegación principal"
    >
      <div className="mx-auto max-w-screen-sm px-3">
        <div className="mb-2 flex items-stretch justify-around rounded-[1.6rem] border border-border/70 bg-surface/85 px-1.5 py-1.5 shadow-soft backdrop-blur-md">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="flex-1 outline-none">
              {({ isActive }) => (
                <span
                  className={`flex flex-col items-center gap-0.5 py-1 transition-colors duration-200 ${
                    isActive ? 'text-primary-strong' : 'text-soft'
                  }`}
                >
                  <span
                    className={`grid h-8 w-12 place-items-center rounded-full transition-all duration-200 ease-gentle ${
                      isActive ? 'bg-primary-soft' : ''
                    }`}
                  >
                    <Icon className="h-[1.3rem] w-[1.3rem]" strokeWidth={isActive ? 2 : 1.7} />
                  </span>
                  <span className="text-2xs font-semibold tracking-wide">{label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
