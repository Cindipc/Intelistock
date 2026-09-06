import { useEffect, useState } from 'react'
import { obtenerResumenNegocio, NEGOCIO_ID } from '../../routes/api'

export default function BusinessPage() {
  const [resumen, setResumen] = useState(null)
  const [dataSource, setDataSource] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    obtenerResumenNegocio(NEGOCIO_ID)
      .then((data) => {
        if (!cancelled) {
          setResumen(data)
          setDataSource('backend')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDataSource('error')
          setError(err.message?.replace('__DB_ERR__', '').replace('__CONN_ERR__', '') || 'No se pudo cargar la informacion del negocio.')
        }
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="page-content workspace-page">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">TU NEGOCIO</p>
          <h1>{resumen?.negocio?.nombre || 'Mi Negocio'}</h1>
          <p className="subtitle">Informacion general de tu cuenta en IntelliStock.</p>
        </div>
      </div>

      {dataSource === 'error' && (
        <div className="branch-insight" style={{ background: '#fee4de', color: '#c5684e', marginBottom: 16, borderRadius: 8, padding: '10px 16px', fontSize: 12 }}>
          <span>⚠</span><span>{error}</span>
        </div>
      )}

      {dataSource === 'loading' && (
        <div className="branch-insight" style={{ background: '#edf3fc', color: '#5175af', marginBottom: 16, borderRadius: 8, padding: '10px 16px', fontSize: 12 }}>
          <span>ℹ</span><span>Cargando informacion del negocio...</span>
        </div>
      )}

      {resumen && (
        <>
          <section className="workspace-cards">
            <article className="workspace-card"><span>PRODUCTOS REGISTRADOS</span><strong>{resumen.total_productos}</strong><small>En tu catalogo</small></article>
            <article className="workspace-card"><span>CATEGORIAS</span><strong>{resumen.total_categorias}</strong><small>Distintas en catalogo</small></article>
            <article className="workspace-card"><span>VENTAS REGISTRADAS</span><strong>{resumen.total_ventas}</strong><small>Tickets totales</small></article>
          </section>

          <section className="workspace-table">
            <div className="table-header">
              <div>
                <p className="panel-kicker">DATOS GENERALES</p>
                <h2>Perfil del negocio</h2>
              </div>
            </div>
            <div className="workspace-row">
              <span className="row-number">01</span>
              <strong>{resumen.negocio.nombre}</strong>
              <span>RFC: {resumen.negocio.rfc || 'No registrado'}</span>
              <b className={`row-status ${resumen.negocio.estado === 'activo' ? 'good' : ''}`}>{resumen.negocio.estado}</b>
              <span className="company-trend">${resumen.ingresos_totales.toLocaleString('es-MX', { minimumFractionDigits: 2 })} en ingresos</span>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
