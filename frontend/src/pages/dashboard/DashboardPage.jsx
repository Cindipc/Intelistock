import { useEffect, useMemo, useState } from 'react'
import { inventoryAlerts, inventoryProducts } from '../../data/dashboardData'
import { listarProductos, normalizarProducto } from '../../routes/api'

const riskOrder = ['Critico', 'Bajo', 'Sobrestock', 'Saludable']

function TrendChart() {
  const points = [32, 44, 38, 58, 52, 72, 66, 86, 78, 94]
  return <div className="executive-chart"><div className="chart-axis"><span>200</span><span>100</span><span>0</span></div><div className="chart-plot"><div className="chart-grid-lines"><i /><i /><i /></div><div className="chart-bars">{points.map((value, index) => <span key={index} style={{ height: `${value}%` }} />)}</div><div className="chart-labels"><small>Sem 1</small><small>Sem 2</small><small>Sem 3</small><small>Sem 4</small></div></div></div>
}

function RiskProduct({ product, onSelect }) {
  const percentage = Math.min(100, Math.round((product.available / Math.max(product.minimum, 1)) * 100))
  return <button className="risk-product" onClick={() => onSelect(product)}><span className={`product-avatar ${product.tone}`}>{product.avatar}</span><span className="risk-product-copy"><strong>{product.name}</strong><small>{product.sku} · {product.category}</small><span className="risk-progress"><i style={{ width: `${percentage}%` }} /></span></span><span className={`risk-badge risk-${product.risk.toLowerCase()}`}>{product.risk}</span><span className="risk-product-value">{product.available} u.</span></button>
}

function useBackendProducts() {
  const [backendProducts, setBackendProducts] = useState([])
  const [dataSource, setDataSource] = useState('loading')

  useEffect(() => {
    let cancelled = false
    listarProductos(1)
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
  }, [])

  return { backendProducts, dataSource }
}

export default function DashboardPage({ query, onRefresh, onOpenModal }) {
  const [activeFilter] = useState('Todos')
  const { backendProducts, dataSource } = useBackendProducts()
  const catalogProducts = backendProducts.length > 0 ? backendProducts : inventoryProducts

  const products = useMemo(() => catalogProducts.filter((product) => (activeFilter === 'Todos' || product.risk === activeFilter) && `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk)), [activeFilter, catalogProducts, query])
  const riskProducts = products.filter((product) => product.risk === 'Critico' || product.risk === 'Bajo')

  const totalProductos = catalogProducts.length
  const productosEnRiesgo = catalogProducts.filter(p => p.risk === 'Critico' || p.risk === 'Bajo').length
  const criticos = catalogProducts.filter(p => p.risk === 'Critico').length
  const bajos = catalogProducts.filter(p => p.risk === 'Bajo').length
  const saludables = catalogProducts.filter(p => p.risk === 'Saludable').length
  const porcentajeSaludable = totalProductos > 0 ? Math.round((saludables / totalProductos) * 100) : 0
  const valorInventario = catalogProducts.reduce((sum, p) => sum + (p.precio_unitario || 0) * p.available, 0)
  const valorFormateado = valorInventario > 0 ? `$${Number(valorInventario).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$50,774'

  return <div className="page-content executive-dashboard"><section className="executive-hero"><div><p className="eyebrow">RESUMEN EJECUTIVO · 06 SEP 2026</p><h1>Tu inventario,<br /><em>bajo control.</em></h1><p className="subtitle">Una lectura rapida de lo que merece atencion hoy.</p></div><div className="hero-actions"><span className="live-status"><i />{dataSource === 'backend' ? 'Datos del backend' : dataSource === 'empty' ? 'Backend conectado, sin productos' : 'Datos de demostracion'}</span><button className="refresh-button" onClick={onRefresh}>Actualizar <span>↻</span></button></div></section>{dataSource === 'empty' && <div className="branch-insight" style={{ background: '#edf3fc', color: '#5175af', marginBottom: 16, borderRadius: 8, padding: '10px 16px', fontSize: 12 }}><span>ℹ</span><span>Backend conectado pero sin productos en la base de datos. Sube un CSV de ventas o crea productos para ver datos reales.</span></div>}{dataSource === 'demo' && <div className="branch-insight" style={{ background: '#fff8f0', color: '#aa741d', marginBottom: 16, borderRadius: 8, padding: '10px 16px', fontSize: 12 }}><span>⚠</span><span>Backend no disponible. Mostrando datos de demostracion.</span></div>}<section className="executive-kpis"><article className="kpi-primary"><span>VALOR DEL INVENTARIO</span><strong>{valorFormateado}</strong><small>{totalProductos} productos en catalogo</small><div className="kpi-spark">{[35, 45, 38, 62, 55, 72, 68, 84].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></article><article><span>PRODUCTOS EN RIESGO</span><strong>{String(productosEnRiesgo).padStart(2, '0')}</strong><small className="danger-text">{criticos} criticos · {bajos} bajos</small></article><article><span>PRODUCTOS TOTALES</span><strong>{totalProductos}</strong><small>{dataSource === 'backend' ? 'Del backend' : 'De demostracion'}</small></article><article><span>INVENTARIO SALUDABLE</span><strong>{porcentajeSaludable}%</strong><small>Objetivo operativo: 75%</small><div className="kpi-progress"><i style={{ width: `${porcentajeSaludable}%` }} /></div></article></section><section className="executive-grid"><section className="executive-panel demand-panel"><div className="panel-header"><div><p className="panel-kicker">TENDENCIA DEL NEGOCIO</p><h2>Demanda proyectada</h2></div><div className="period-switch"><button className="active">30 dias</button><button>90 dias</button></div></div><div className="demand-summary"><strong>+12.6%</strong><span>crecimiento estimado de demanda</span><small>comparado con el periodo anterior</small></div><TrendChart /></section><section className="executive-panel attention-panel"><div className="panel-header"><div><p className="panel-kicker">ATENCION INMEDIATA</p><h2>Lo que requiere accion</h2></div><button className="panel-link" onClick={() => onOpenModal({ eyebrow: 'Panel de alertas', title: 'Todas las alertas', children: <div>{inventoryAlerts.map(a => <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}><strong>{a.type}</strong><p>{a.product} — {a.recommendation}</p></div>)}</div> })}>Ver todas</button></div><div className="alert-stack">{riskProducts.length > 0 ? riskProducts.map((product) => <RiskProduct key={product.id} product={product} onSelect={(p) => onOpenModal({ eyebrow: p.sku, title: p.name, children: <div><p>{p.reason}</p><p><strong>{p.available} piezas</strong> disponibles · estado: <strong>{p.risk}</strong>.</p></div> })} />) : inventoryAlerts.slice(0, 2).map((alert) => <div key={alert.id} className="attention-card"><div className="attention-copy"><strong>{alert.type}</strong><small>{alert.product} — {alert.recommendation}</small></div><span className="alert-impact">{alert.impact}</span></div>)}</div></section></section><section className="executive-panel"><div className="panel-header"><div><p className="panel-kicker">CATALAGO DE PRODUCTOS</p><h2>Todos los productos</h2></div><span style={{ fontSize: 10, color: '#7d8989' }}>{totalProductos} registros</span></div><div className="dashboard-product-list"><div className="dashboard-list-header"><span>PRODUCTO</span><span>STOCK</span><span>ESTADO</span></div>{products.slice(0, 8).map((product) => <button className="dashboard-product-card" key={product.id} onClick={() => onOpenModal({ eyebrow: product.sku, title: product.name, children: <div><p>{product.reason}</p><p><strong>{product.available} piezas</strong> disponibles · estado: <strong>{product.risk}</strong>.</p></div> })}><span className="dashboard-product-info"><span className={`product-avatar ${product.tone}`}>{product.avatar}</span><span><strong>{product.name}</strong><small>{product.sku} · {product.category}</small></span></span><span>{product.available} u.</span><span className={`risk-badge risk-${product.risk.toLowerCase()}`}>{product.risk}</span></button>)}</div></section></div>
}
