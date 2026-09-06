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
          <h2 style={{ color: '#1d2829' }}>Algo salió mal</h2>
          <p style={{ color: '#7d8989', marginBottom: 20 }}>
            Ocurrió un error inesperado en esta sección. Intenta recargar la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              background: '#087f78',
              color: '#fff',
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
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
