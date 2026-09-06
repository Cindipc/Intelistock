import { useMemo, useState } from 'react'
import Icon from '../../components/ui/Icon'
import { branches, inventoryProducts } from '../../data/dashboardData'
import { obtenerRecomendacionesCompra } from '../../routes/api'
import { NEGOCIO_ID_DEMO } from '../../data/datosDemo'

function StockProductList({ products, apiRecomendaciones }) {
  const buscarRecomendacion = (sku) =>
    apiRecomendaciones?.find((r) => r.producto_id === sku)

  return (
    <section className="stock-product-list">
      <div className="stock-list-heading">
        <div>
          <p className="panel-kicker">PRODUCTOS EN STOCK</p>
          <h2>{apiRecomendaciones ? 'Demanda proyectada (modelo real)' : 'Inventario disponible'}</h2>
          <p>La predicción usa las unidades vendidas en los últimos 30 días y la tendencia reciente.</p>
        </div>
        <span>{products.length} productos</span>
      </div>
      <div className="stock-list-table">
        <div className="stock-list-header">
          <span>PRODUCTO</span><span>STOCK ACTUAL</span><span>VENDIDOS 30 DÍAS</span>
          <span>PREDICCIÓN</span><span>CONFIANZA</span>
        </div>
        {products.map((product) => {
          const recomendacion = buscarRecomendacion(product.sku)
          return (
            <div className="stock-product-row" key={product.id}>
              <span className="stock-product-name">
                <span className={`product-avatar ${product.tone}`}>{product.avatar}</span>
                <span><strong>{product.name}</strong><small>{product.sku} · {product.category}</small></span>
              </span>
              <strong>{product.available} u.</strong>
              <strong>{product.sold30} u.</strong>
              <span>
                <strong className="projected-demand">
                  {recomendacion ? `${Math.round(recomendacion.cantidad_estimada)} u.` : `${Math.round(product.sold30 * (1 + Number.parseFloat(product.trend) / 100))} u.`}
                </strong>
                <small>{recomendacion ? `en ${recomendacion.horizonte_dias} dias` : `${product.trend} (estimado)`}</small>
              </span>
              <span>
                <strong>{recomendacion ? recomendacion.confianza : 'sin calcular'}</strong>
                <small>{recomendacion ? recomendacion.metodo_usado : 'presiona "Calcular con IA"'}</small>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function PredictionsPage({ onOpenModal }) {
  const [branchId, setBranchId] = useState(branches[0].id)
  const [view, setView] = useState('Resumen')
  const [apiRecomendaciones, setApiRecomendaciones] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const branch = branches.find((item) => item.id === branchId)
  const inStockProducts = useMemo(() => inventoryProducts.filter((product) => product.available > 0), [])
  const predictedDemand = (product) => Math.round(product.sold30 * (1 + Number.parseFloat(product.trend) / 100))

  const calcularConIA = async () => {
    setCargando(true)
    setError(null)
    try {
      const respuesta = await obtenerRecomendacionesCompra(NEGOCIO_ID_DEMO, '15')
      setApiRecomendaciones(respuesta.recomendaciones || [])
      setView('Demanda')
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servicio de predicción.')
      if (onOpenModal) {
        onOpenModal({ eyebrow: 'Error de prediccion', title: 'No se pudo calcular', children: <p>{err.message || 'Error desconocido.'}</p> })
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="page-content branch-page">
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">MOTOR DE PREDICCION</p>
          <h1>Predicciones</h1>
          <p className="subtitle">Consulta stock y demanda proyectada por identificador de sucursal.</p>
        </div>
        <label className="branch-id-field">
          <span>ID DE SUCURSAL</span>
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {branches.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
          </select>
        </label>
      </section>

      <section className="branch-picker">
        <div className="branch-picker-heading">
          <div>
            <p className="panel-kicker">SUCURSALES DISPONIBLES</p>
            <h2>Selecciona una sucursal</h2>
          </div>
          <span className="branch-count">{branches.length} sucursales</span>
        </div>
        <div className="branch-list">
          {branches.map((item) => (
            <button className={`branch-card ${item.id === branch.id ? 'selected' : ''}`} key={item.id} onClick={() => setBranchId(item.id)}>
              <span className="branch-marker">{item.name.slice(0, 1)}</span>
              <span className="branch-card-copy">
                <strong>{item.name}</strong><small>{item.city}</small><small className="branch-code">{item.id}</small>
              </span>
              <span className={`branch-status ${item.status === 'Revision' ? 'attention' : ''}`}><i />{item.status}</span>
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="branch-summary">
        <div className="branch-summary-header">
          <div>
            <p className="panel-kicker">SUCURSAL ACTIVA · {branch.id}</p>
            <h2>{branch.name} <span>{branch.city}</span></h2>
          </div>
          <div className="view-tabs" role="tablist">
            {['Resumen', 'Stock', 'Demanda'].map((item) => (
              <button role="tab" aria-selected={view === item} className={view === item ? 'selected' : ''} key={item} onClick={() => setView(item)}>{item}</button>
            ))}
          </div>
        </div>

        <div className="branch-kpis">
          <article><span>PRODUCTOS</span><strong>{branch.products}</strong><small>catalogados</small></article>
          <article><span>VALOR EN STOCK</span><strong>{branch.stockValue}</strong><small>inventario actual</small></article>
          <article><span>DEMANDA 15 DIAS</span><strong>{branch.demand}</strong><small>proyeccion estimada</small></article>
        </div>

        {view === 'Resumen' && (
          <div className="branch-insight">
            <span className="status-pulse" />
            <span>La sucursal tiene <strong>2 productos en riesgo</strong>. Calcula la predicción real con el modelo antes de generar la próxima orden.</span>
            <button onClick={calcularConIA} disabled={cargando}>
              {cargando ? 'Calculando...' : 'Calcular con IA'} <Icon name="arrow" />
            </button>
          </div>
        )}

        {error && (
          <div className="branch-insight" style={{ background: '#fee4de', color: '#c5684e' }}>
            <span>⚠</span>
            <span>{error} Se están mostrando datos estimados localmente mientras se restablece la conexión.</span>
            <button onClick={calcularConIA}>Reintentar</button>
          </div>
        )}

        {view !== 'Resumen' && (
          <div className="branch-data-table">
            <div><span>PRODUCTO</span><span>{view === 'Stock' ? 'STOCK DISPONIBLE' : 'DEMANDA 15 DIAS'}</span><span>ESTADO</span></div>
            {inStockProducts.map((product) => {
              const recomendacion = apiRecomendaciones?.find((r) => r.producto_id === product.sku)
              return (
                <div key={product.id}>
                  <span><strong>{product.name}</strong><small>{product.sku}</small></span>
                  <strong>
                    {view === 'Stock'
                      ? `${product.available} u.`
                      : `${recomendacion ? Math.round(recomendacion.cantidad_estimada) : predictedDemand(product)} u.`}
                  </strong>
                  <span className={`risk-badge risk-${product.risk.toLowerCase()}`}>
                    {recomendacion ? recomendacion.confianza : product.risk}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <StockProductList products={inStockProducts} apiRecomendaciones={apiRecomendaciones} />
    </div>
  )
}
