import { Component } from 'react'
import Heart from './Heart'

// Si una pantalla se rompe, en vez de quedar en blanco mostramos una salida
// amable que vuelve al inicio (recarga en '/').
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err) {
    console.error('Romi & Alan — error de pantalla:', err)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
          <Heart variant="duo" className="h-14 w-14" />
          <p className="mt-4 font-display text-xl">Uy, algo se trabó</p>
          <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-muted">
            Volvé al inicio y seguimos donde estábamos.
          </p>
          <button className="btn-primary mt-6" onClick={() => window.location.assign('/')}>
            Volver al inicio
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
