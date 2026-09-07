import { useEffect, useMemo, useState } from 'react'
import { inventoryAlerts, inventoryProducts } from '../../data/dashboardData'
import { listarProductos, normalizarProducto, NEGOCIO_ID } from '../../routes/api'

const kpiIcons = {
  valor: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5.5c-1-1.2-3-1.8-5-1.8-2.6 0-4.5 1.2-4.5 3 0 4.5 10 2.5 10 7 0 1.9-2 3-4.8 3-2.2 0-4.3-.7-5.4-2" />
    </svg>
  ),
  riesgo: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  totales: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 16-9 5-9-5M21 8l-9 5-9-5 9-5 9 5Z" /><path d="m3 16 9 5 9-5" />
    </svg>
  ),
  saludable: (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-2m-1.7 4.2 1.4 1.4M22 18h-2M18 13a6 6 0 1 0-2.9 5.1M8.4 14.6a4 4 0 1 1 6-4.6" />
    </svg>
  ),
}

const riskOrder = ['Critico', 'Bajo', 'Sobrestock', 'Saludable']
const riskIconClass = { Critico: 'orange', Bajo: 'orange', Sobrestock: 'blue', Saludable: 'green' }

function TrendChart() {
  const points = [32, 44, 38, 58, 52, 72, 66, 86, 78, 94]
  return (
    <div className="chart">
      <div className="y-axis"><span>100</span><span>50</span><span>0</span></div>
      <div className="chart-area">
        <div className="grid-lines"><i /><i /><i /></div>
        <div className="bars">
          {points.map((value, index) => (
            <div className="bar-column" key={index}>
              <div className="bar" style={{ height: `${value}%` }}><span>{value}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function useBackendProducts(updated) {
  const [backendProducts, setBackendProducts] = useState([])
  const [dataSource, setDataSource] = useState('loading')

  useEffect(() => {
    let cancelled = false
    listarProductos(NEGOCIO_ID)
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setBackendProducts(data.map(normalizarProducto))
            setDataSource('backend')
          } else if (Array.isArray(data)) {
            setBackendProducts([])
            setDataSource('empty')
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendProducts([])
          setDataSource('demo')
        }
      })
    return () => { cancelled = true }
  }, [updated])

  return { backendProducts, dataSource }
}

export default function DashboardPage({ query, onRefresh, onOpenModal, updated }) {
  const [activeFilter] = useState('Todos')
  const { backendProducts, dataSource } = useBackendProducts(updated)
  const catalogProducts = backendProducts.length > 0 ? backendProducts : inventoryProducts

  const products = useMemo(
    () => catalogProducts
      .filter((product) => (activeFilter === 'Todos' || product.risk === activeFilter) && `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk)),
    [activeFilter, catalogProducts, query]
  )
  const riskProducts = products.filter((product) => product.risk === 'Critico' || product.risk === 'Bajo')

  const totalProductos = catalogProducts.length
  const productosEnRiesgo = catalogProducts.filter(p => p.risk === 'Critico' || p.risk === 'Bajo').length
  const criticos = catalogProducts.filter(p => p.risk === 'Critico').length
  const bajos = catalogProducts.filter(p => p.risk === 'Bajo').length
  const saludables = catalogProducts.filter(p => p.risk === 'Saludable').length
  const porcentajeSaludable = totalProductos > 0 ? Math.round((saludables / totalProductos) * 100) : 0
  const valorInventario = catalogProducts.reduce((sum, p) => sum + (p.precio_unitario || 0) * p.available, 0)
  const valorFormateado = valorInventario > 0 ? `$${Number(valorInventario).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0'

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">RESUMEN EJECUTIVO</p>
          <h1>Tu inventario, <span>bajo control</span></h1>
          <p className="subtitle">Una lectura rapida de lo que merece atencion hoy.</p>
        </div>
        <button className={`refresh-button ${updated ? 'is-updated' : ''}`} onClick={onRefresh}>
          {updated ? 'Actualizado ✓' : 'Actualizar'} <span>↻</span>
        </button>
      </section>

<div className={`branch-insight notice ${dataSource === 'backend' ? 'notice-info' : dataSource === 'empty' ? 'notice-info' : 'notice-warn'}`}>
          <span className="status-pulse" />
          <span>{dataSource === 'backend' ? 'Mostrando datos reales del backend.' : dataSource === 'empty' ? 'Backend conectado pero sin productos todavia.' : 'Backend no disponible, mostrando datos de demostracion.'}</span>
        </div>

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-heading"><span>VALOR DEL INVENTARIO</span><span className="metric-icon coral-bg">{kpiIcons.valor}</span></div>
          <strong>{valorFormateado}</strong>
          <p>{totalProductos} productos en catalogo</p>
          <div className="mini-bars">
            {[35, 45, 38, 62, 55, 72, 68, 84].map((h, i) => <i key={i} className={i === 7 ? 'current' : ''} style={{ height: `${h}%` }} />)}
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-heading"><span>PRODUCTOS EN RIESGO</span><span className="metric-icon yellow-bg">{kpiIcons.riesgo}</span></div>
          <strong className="danger">{String(productosEnRiesgo).padStart(2, '0')}</strong>
          <p>{criticos} criticos · {bajos} bajos</p>
        </article>
        <article className="metric-card">
          <div className="metric-heading"><span>PRODUCTOS TOTALES</span><span className="metric-icon blue-bg">{kpiIcons.totales}</span></div>
          <strong>{totalProductos}</strong>
          <p>{dataSource === 'backend' ? 'Del backend' : 'De demostracion'}</p>
        </article>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-heading"><span>INVENTARIO SALUDABLE</span><span className="metric-icon green-bg">{kpiIcons.saludable}</span></div>
          <strong>{porcentajeSaludable}%</strong>
          <p>Objetivo operativo: 75%</p>
          <div className="progress-line"><span style={{ width: `${porcentajeSaludable}%` }} /></div>
          <div className="progress-labels"><small>0%</small><small>75%</small><small>100%</small></div>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">TENDENCIA DEL NEGOCIO</p>
              <h2>Demanda proyectada</h2>
            </div>
            <div className="period-tabs">
              <button className="selected">30 dias</button>
              <button>90 dias</button>
            </div>
          </div>
          <TrendChart />
          <div className="chart-note">
            <span className="status-pulse" />
            <span>Tendencia calculada sobre el catalogo actual.</span>
          </div>
        </section>

        <section className="panel alerts-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">ATENCION INMEDIATA</p>
              <h2>Lo que requiere accion</h2>
            </div>
          </div>
          <div className="alert-list">
            {riskProducts.length > 0 ? riskProducts.slice(0, 5).map((product) => (
              <div className="alert-item" key={product.id} onClick={() => onOpenModal({ eyebrow: product.sku, title: product.name, children: <div><p>{product.reason}</p><p><strong>{product.available} piezas</strong> disponibles · estado: <strong>{product.risk}</strong>.</p></div> })} style={{ cursor: 'pointer' }}>
                <span className={`alert-icon ${riskIconClass[product.risk] || 'orange'}`}>{product.avatar}</span>
                <span><strong>{product.name}</strong><small>{product.sku} · {product.available} u. disponibles</small></span>
                <span className="alert-arrow">›</span>
              </div>
            )) : inventoryAlerts.slice(0, 3).map((alert) => (
              <div className="alert-item" key={alert.id}>
                <span className="alert-icon blue">i</span>
                <span><strong>{alert.type}</strong><small>{alert.product} — {alert.recommendation}</small></span>
                <span className="alert-arrow">›</span>
              </div>
            ))}
          </div>
          <a className="alert-footer" href="#" onClick={(e) => { e.preventDefault(); onOpenModal({ eyebrow: 'Panel de alertas', title: 'Todas las alertas', children: <div>{inventoryAlerts.map(a => <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><strong>{a.type}</strong><p>{a.product} — {a.recommendation}</p></div>)}</div> }) }}>
            Ver todas las alertas
          </a>
        </section>
      </div>

      <section className="workspace-table">
        <div className="table-header">
          <div>
            <p className="panel-kicker">CATALOGO DE PRODUCTOS</p>
            <h2>Todos los productos</h2>
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{totalProductos} registros</span>
        </div>
        {products.slice(0, 8).map((product, index) => (
          <div className="workspace-row" key={product.id} onClick={() => onOpenModal({ eyebrow: product.sku, title: product.name, children: <div><p>{product.reason}</p><p><strong>{product.available} piezas</strong> disponibles · estado: <strong>{product.risk}</strong>.</p></div> })} style={{ cursor: 'pointer' }}>
            <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
            <strong>{product.name}</strong>
            <span>{product.sku} · {product.category}</span>
            <b className={`row-status ${product.risk === 'Saludable' ? 'good' : ''}`}>{product.risk}</b>
            <span className="company-arrow">›</span>
          </div>
        ))}
      </section>
    </div>
  )
}
