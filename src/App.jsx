import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Brand from './components/Brand'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './screens/Login'
import Inicio from './screens/Inicio'
import Charlar from './screens/Charlar'
import Compras from './screens/Compras'
import Caja from './screens/Caja'
import Planes from './screens/Planes'
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
          <Route path="/compras" element={<Compras />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
