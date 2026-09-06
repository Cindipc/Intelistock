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

const tableGrid = { display: 'grid', gridTemplateColumns: '80px 1fr 140px', alignItems: 'center', gap: 12, padding: '0 22px' }
const headerStyle = { ...tableGrid, minHeight: 44, background: '#edf3fc', color: '#63748e', fontSize: 10, fontWeight: 700, letterSpacing: '0.7px' }
const rowStyle = { ...tableGrid, minHeight: 56, borderTop: '1px solid #dfe6f0', fontSize: 12 }

export default function HistoricalPage() {
  const [ventas, setVentas] = useState([])
  const [dataSource, setDataSource] = useState('loading')
  const [, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  const cargarVentas = useCallback(async () => {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarVentas(1)
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setVentas(data.map(normalizarVenta))
            setDataSource('backend')
          } else if (Array.isArray(data)) {
            setVentas(VENTAS_DEMO)
            setDataSource('empty')
          }
        }
      } catch {
        if (!cancelled) {
          setVentas(VENTAS_DEMO)
          setDataSource('demo')
          setError('Backend no disponible. Mostrando datos de demostracion.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

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

  return (
    <div className="page-content workbench-page">
      <div className="workbench-header">
        <div>
          <p className="eyebrow">CENTRO DE DATOS</p>
          <h1>Historial de Ventas</h1>
          <p className="subtitle">Consulta registros de venta y carga nuevos archivos para alimentar los modelos predictivos.</p>
        </div>
        <span className="sync-badge" style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, background: dataSource === 'backend' ? '#e5f4eb' : '#fff8f0', color: dataSource === 'backend' ? '#38805e' : '#aa741d', fontWeight: 700 }}>
          {dataSource === 'backend' ? '● Sincronizado' : dataSource === 'empty' ? '● Sin datos' : dataSource === 'loading' ? '● Cargando...' : '● Modo demo'}
        </span>
      </div>

      <section className="recommendation-kpis">
        <article><span>REGISTROS</span><strong>{totalVentas}</strong><small>{dataSource === 'backend' ? 'ventas reales' : 'datos de ejemplo'}</small></article>
        <article><span>INGRESOS</span><strong>{ingresosFormateados}</strong><small>acumulado</small></article>
        <article><span>ESTADO</span><strong>{dataSource === 'backend' ? 'Activo' : dataSource === 'empty' ? 'Conectado' : dataSource === 'loading' ? 'Cargando' : 'Demo'}</strong><small>{dataSource === 'demo' ? 'Sin conexion' : 'Backend OK'}</small></article>
      </section>

      {dataSource === 'empty' && (
        <div className="branch-insight" style={{ background: '#edf3fc', color: '#5175af', borderRadius: 8, padding: '10px 16px', fontSize: 12 }}>
          <span>ℹ</span><span>Backend conectado pero sin ventas registradas. Sube un archivo CSV para comenzar.</span>
        </div>
      )}

      <div className="history-grid">
        <section className="history-card">
          <h2>1. Carga de Ventas</h2>
          <p>Actualiza la base estadistica con las ventas de tu negocio.</p>
          <div className="upload-zone">
            <span style={{ fontSize: 24 }}>⇧</span>
            <strong>Selecciona tu archivo de ventas</strong>
            <small>Archivos permitidos: .xlsx · .csv</small>
            <label className="primary-button" style={{ cursor: 'pointer', marginTop: 8 }}>
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
              <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files?.[0])} disabled={uploading} />
            </label>
            {uploadStatus && <small style={{ marginTop: 8, color: uploadStatus.startsWith('Error') ? '#c5684e' : '#38805e' }}>{uploadStatus}</small>}
          </div>
        </section>

        <section className="history-card">
          <h2>2. Movimiento de Inventario</h2>
          <p>Los movimientos se gestionan en una proxima ruta CRUD del backend.</p>
          <div className="upload-zone" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
            <span style={{ fontSize: 24 }}>◌</span>
            <strong>Proximamente</strong>
            <small>Endpoint /movimientos en desarrollo</small>
          </div>
        </section>
      </div>

      {error && (
        <div className="branch-insight" style={{ background: '#fee4de', color: '#c5684e', marginTop: 16, borderRadius: 8, padding: '10px 16px', fontSize: 12 }}>
          <span>⚠</span><span>{error}</span>
          <button onClick={cargarVentas} style={{ marginLeft: 'auto', background: 'transparent', color: '#c5684e', fontWeight: 700, fontSize: 11 }}>Reintentar</button>
        </div>
      )}

      {ventas.length > 0 && (
        <div style={{ marginTop: 24, background: '#fff', border: '1px solid #dfe6f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgb(30 53 87 / 5%)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #dfe6f0' }}>
            <p className="panel-kicker">VENTAS REGISTRADAS</p>
            <h2 style={{ margin: 0, fontSize: 19, fontFamily: "'Space Grotesk', sans-serif" }}>{dataSource === 'backend' ? 'Datos del backend' : 'Datos de ejemplo'}</h2>
          </div>
          <div style={headerStyle}>
            <span>ID</span>
            <span>FECHA</span>
            <span style={{ textAlign: 'right' }}>TOTAL</span>
          </div>
          {ventas.slice(0, 50).map((venta) => (
            <div style={rowStyle} key={venta.id}>
              <code style={{ color: '#7c8ca3', fontSize: 11 }}>#{venta.id}</code>
              <span style={{ fontSize: 12 }}>{new Date(venta.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#172742' }}>${Number(venta.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          {ventas.length > 50 && <div style={{ padding: '12px 22px', color: '#7d8989', fontSize: 11, borderTop: '1px solid #dfe6f0' }}>Mostrando 50 de {ventas.length} registros</div>}
        </div>
      )}
    </div>
  )
}
