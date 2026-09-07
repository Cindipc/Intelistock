import { useEffect, useState, useCallback } from 'react'
import { listarVentas, importarVentas, normalizarVenta } from '../../routes/api'

const VENTAS_DEMO = [
  { id: 1001, fecha: '2026-09-01', total: 1250.50 },
  { id: 1002, fecha: '2026-09-02', total: 890.00 },
  { id: 1003, fecha: '2026-09-03', total: 2100.75 },
  { id: 1004, fecha: '2026-09-04', total: 675.25 },
  { id: 1005, fecha: '2026-09-05', total: 1480.00 },
  { id: 1006, fecha: '2026-09-06', total: 320.00 },
]

const dataSourceChip = {
  backend: { label: 'Sincronizado', cls: 'ok' },
  empty: { label: 'Sin datos', cls: 'wait' },
  loading: { label: 'Cargando', cls: 'loading' },
  demo: { label: 'Modo demo', cls: 'warn' },
}

export default function HistoricalPage() {
  const [ventas, setVentas] = useState([])
  const [dataSource, setDataSource] = useState('loading')
  const [error, setError] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  const cargarVentas = useCallback(async () => {
    setError(null)
    try {
      const data = await listarVentas(1)
      if (Array.isArray(data) && data.length > 0) {
        setVentas(data.map(normalizarVenta))
        setDataSource('backend')
      } else if (Array.isArray(data)) {
        setVentas(VENTAS_DEMO)
        setDataSource('empty')
      }
    } catch {
      setVentas(VENTAS_DEMO)
      setDataSource('demo')
      setError('Backend no disponible. Mostrando datos de demostracion.')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asincrona inicial del historial
    cargarVentas()
  }, [cargarVentas])

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadStatus('')
    try {
      const result = await importarVentas(1, file)
      setUploadStatus(`${result.filas_procesadas || 0} filas importadas correctamente.`)
      await cargarVentas()
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const totalVentas = ventas.length
  const totalIngresos = ventas.reduce((sum, v) => sum + v.total, 0)
  const ingresosFormateados = `$${Number(totalIngresos).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const chip = dataSourceChip[dataSource] || dataSourceChip.demo

  return (
    <div className="page-content">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">CENTRO DE DATOS</p>
          <h1>Historial de Ventas</h1>
          <p className="subtitle">Consulta registros de venta y carga nuevos archivos para alimentar los modelos predictivos.</p>
        </div>
        <span className={`status-chip ${chip.cls}`}><i /><span>{chip.label}</span></span>
      </div>

      <section className="workspace-cards">
        <article className="workspace-card"><span>REGISTROS</span><strong>{totalVentas}</strong><small>{dataSource === 'backend' ? 'ventas reales' : 'datos de ejemplo'}</small></article>
        <article className="workspace-card"><span>INGRESOS</span><strong>{ingresosFormateados}</strong><small>acumulado</small></article>
        <article className="workspace-card"><span>ESTADO</span><strong>{dataSource === 'backend' ? 'Activo' : dataSource === 'empty' ? 'Conectado' : dataSource === 'loading' ? 'Cargando' : 'Demo'}</strong><small>{dataSource === 'demo' ? 'Sin conexion' : 'Backend OK'}</small></article>
      </section>

      {dataSource === 'empty' && (
        <div className="notice notice-info">
          <span className="status-pulse" />
          <span>Backend conectado pero sin ventas registradas. Sube un archivo CSV para comenzar.</span>
        </div>
      )}

      {error && (
        <div className="notice notice-danger">
          <span>⚠</span><span>{error}</span>
          <button onClick={cargarVentas}>Reintentar</button>
        </div>
      )}

      <div className="data-grid">
        <section className="panel data-card">
          <h2>1. Carga de Ventas</h2>
          <p className="panel-description">Actualiza la base estadistica con las ventas de tu negocio.</p>
          <div className="upload-zone">
            <span className="upload-icon">⇧</span>
            <strong>Selecciona tu archivo de ventas</strong>
            <small>Archivos permitidos: .xlsx · .csv</small>
            <label className="refresh-button">
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
              <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files?.[0])} disabled={uploading} />
            </label>
            {uploadStatus && <small className={`upload-status ${uploadStatus.startsWith('Error') ? 'err' : 'ok'}`}>{uploadStatus}</small>}
          </div>
        </section>

        <section className="panel data-card">
          <h2>2. Movimiento de Inventario</h2>
          <p className="panel-description">Los movimientos se gestionan en una proxima ruta CRUD del backend.</p>
          <div className="upload-zone disabled">
            <span className="upload-icon">◌</span>
            <strong>Proximamente</strong>
            <small>Endpoint /movimientos en desarrollo</small>
          </div>
        </section>
      </div>

      {ventas.length > 0 && (
        <div className="workspace-table ventas-table">
          <div className="table-header">
            <div>
              <p className="panel-kicker">VENTAS REGISTRADAS</p>
              <h2>{dataSource === 'backend' ? 'Datos del backend' : 'Datos de ejemplo'}</h2>
            </div>
          </div>
          <div className="ventas-header">
            <span>ID</span>
            <span>FECHA</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span>
          </div>
          {ventas.slice(0, 50).map((venta) => (
            <div className="ventas-row" key={venta.id}>
              <code>#{venta.id}</code>
              <span>{new Date(venta.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span>${Number(venta.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          {ventas.length > 50 && <div className="ventas-footer">Mostrando 50 de {ventas.length} registros</div>}
        </div>
      )}
    </div>
  )
}