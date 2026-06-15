import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Heart from '../components/Heart'
import { Segmented } from '../components/ui'
import Pulso from '../components/Pulso'
import Encuentro from '../components/Encuentro'
import Preguntas from '../components/Preguntas'
import Fotos from '../components/Fotos'

// "Nosotros" reúne el vínculo (pulso + encuentro), las preguntas y las fotos.
export default function Nosotros() {
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab || 'vinculo')
  return (
    <div className="page">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Nosotros</h1>
          <p className="mt-0.5 text-sm text-muted">Nuestro vínculo, las preguntas y las fotos.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'vinculo', label: 'Conexión' },
            { value: 'preguntas', label: 'Preguntas' },
            { value: 'fotos', label: 'Fotos' },
          ]}
        />
      </div>

      {tab === 'vinculo' ? (
        <div className="space-y-8">
          <Pulso />
          <Encuentro />
        </div>
      ) : tab === 'preguntas' ? (
        <Preguntas />
      ) : (
        <Fotos />
      )}
    </div>
  )
}
