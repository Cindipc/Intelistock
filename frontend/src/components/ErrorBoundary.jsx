import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Error capturado por ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
          <h2 style={{ color: 'var(--ink)' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
            Ocurrió un error inesperado en esta sección. Intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #eccb9c, #d8ad76)',
              color: '#221811',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: '0 8px 22px rgb(216 173 118 / 30%)',
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
