import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Brand from './components/Brand'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './screens/Login'
import Inicio from './screens/Inicio'
import Charlar from './screens/Charlar'
import Casa from './screens/Casa'
import Planes from './screens/Planes'
import Nosotros from './screens/Nosotros'
import Conexion from './screens/Conexion'
import Fotos from './screens/Fotos'
import Preguntas from './screens/Preguntas'
import Ajustes from './screens/Ajustes'

function FullScreenLoader() {
  return (
    <div className="grid min-h-[100svh] place-items-center">
      <Brand stacked size="lg" />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <FullScreenLoader />
  if (!user) return <Login />

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/charlar" element={<Charlar />} />
          <Route path="/casa" element={<Casa />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/conexion" element={<Conexion />} />
          <Route path="/fotos" element={<Fotos />} />
          <Route path="/preguntas" element={<Preguntas />} />
          <Route path="/ajustes" element={<Ajustes />} />
          {/* compras/caja viejas → ahora viven en Casa */}
          <Route path="/compras" element={<Navigate to="/casa" replace />} />
          <Route path="/caja" element={<Navigate to="/casa" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
