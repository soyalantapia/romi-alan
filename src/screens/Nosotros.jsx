import { useState } from 'react'
import Heart from '../components/Heart'
import { Segmented } from '../components/ui'
import Pulso from '../components/Pulso'
import Encuentro from '../components/Encuentro'
import Fotos from '../components/Fotos'

// "Nosotros" reúne el pulso + el encuentro (contenido principal) y las fotos aparte.
export default function Nosotros() {
  const [tab, setTab] = useState('vinculo')
  return (
    <div className="page">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Nosotros</h1>
          <p className="mt-0.5 text-sm text-muted">Nuestro pulso, el encuentro y las fotos.</p>
        </div>
        <Heart variant="duo" className="h-8 w-8" />
      </header>

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'vinculo', label: 'Conexión' },
            { value: 'fotos', label: 'Fotos' },
          ]}
        />
      </div>

      {tab === 'vinculo' ? (
        <div className="space-y-8">
          <Pulso />
          <Encuentro />
        </div>
      ) : (
        <Fotos />
      )}
    </div>
  )
}
