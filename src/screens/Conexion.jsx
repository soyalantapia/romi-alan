import { useState } from 'react'
import { Segmented } from '../components/ui'
import Pulso from '../components/Pulso'
import Encuentro from '../components/Encuentro'
import Heart from '../components/Heart'

// Conexión = el pulso de la relación + el encuentro semanal, en pestañas claras.
export default function Conexion() {
  const [tab, setTab] = useState('pulso')
  return (
    <div className="page">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Conexión</h1>
          <p className="mt-0.5 text-sm text-muted">Cómo venimos y el encuentro de la semana.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'pulso', label: 'Pulso' },
            { value: 'encuentro', label: 'Encuentro' },
          ]}
        />
      </div>

      {tab === 'pulso' ? <Pulso /> : <Encuentro />}
    </div>
  )
}
