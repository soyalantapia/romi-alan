import { useState } from 'react'
import Compras from './Compras'
import Caja from './Caja'
import { Segmented } from '../components/ui'

// "Casa" = las dos cosas logísticas del hogar, juntas en pestañas.
export default function Casa() {
  const [tab, setTab] = useState('compras')
  return (
    <div className="page">
      <header className="mb-4">
        <h1 className="font-display text-3xl font-medium tracking-tight">Casa</h1>
        <p className="mt-0.5 text-sm text-muted">Las cosas de la casa, juntas.</p>
      </header>

      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'compras', label: 'Compras' },
            { value: 'caja', label: 'Caja' },
          ]}
        />
      </div>

      {tab === 'compras' ? <Compras /> : <Caja />}
    </div>
  )
}
