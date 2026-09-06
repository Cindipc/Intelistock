import { useEffect, useMemo, useState } from 'react'
import Icon from '../../components/ui/Icon'
import { branches, inventoryProducts } from '../../data/dashboardData'
import { listarProductos, normalizarProducto, obtenerPrediccion, NEGOCIO_ID } from '../../routes/api'

function StockProductList({ products, apiRecomendaciones }) {
  const buscarRecomendacion = (product) => apiRecomendaciones?.find((r) => Number(r.producto_id) === Number(product.backendId))

  return (
    <section className="stock-product-list">
      <div className="stock-list-heading">
        <div>
          <p className="panel-kicker">PRODUCTOS EN STOCK</p>
          <h2>{apiRecomendaciones ? 'Demanda proyectada (modelo real)' : 'Inventario disponible'}</h2>
          <p>La prediccion usa las unidades vendidas en los ultimos 30 dias y la tendencia reciente.</p>
        </div>
        <span>{products.length} productos</span>
      </div>
      <div className="stock-list-table">
        <div className="stock-list-header">
          <span>PRODUCTO</span><span>STOCK ACTUAL</span><span>VENDIDOS 30 DIAS</span>
          <span>PREDICCION</span><span>CONFIANZA</span>
        </div>
        {products.map((product) => {
          const recomendacion = buscarRecomendacion(product)
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
                  {recomendacion ? `${recomendacion.cantidad_estimada} u.` : `${Math.round(product.sold30 * (1 + Number.parseFloat(product.trend) / 100))} u.`}
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

function useBackendProducts() {
  const [products, setProducts] = useState(inventoryProducts.filter(p => p.available > 0))
  const [dataSource, setDataSource] = useState('loading')

  useEffect(() => {
    let cancelled = false
    listarProductos(NEGOCIO_ID)
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            const normalized = data.map(normalizarProducto)
            setProducts(normalized.filter(p => p.available > 0))
            setDataSource('backend')
          } else if (Array.isArray(data)) {
            setProducts(inventoryProducts.filter(p => p.available > 0))
            setDataSource('empty')
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts(inventoryProducts.filter(p => p.available > 0))
          setDataSource('demo')
        }
      })
    return () => { cancelled = true }
  }, [])

  return { products, dataSource }
}

export default function PredictionsPage({ onOpenModal }) {
  const [branchId, setBranchId] = useState(branches[0].id)
  const [view, setView] = useState('Resumen')
  const [apiRecomendaciones, setApiRecomendaciones] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [horizonteSeleccionado, setHorizonteSeleccionado] = useState('15')

  const { products: backendProducts, dataSource } = useBackendProducts()
  const branch = branches.find((item) => item.id === branchId)
  const inStockProducts = useMemo(() => backendProducts.filter((product) => product.available > 0), [backendProducts])
  const predictedDemand = (product) => Math.round(product.sold30 * (1 + Number.parseFloat(product.trend) / 100))

  useEffect(() => {
    if (!productoSeleccionado && inStockProducts.length > 0) {
      setProductoSeleccionado(String(inStockProducts[0].backendId))
    }
  }, [inStockProducts, productoSeleccionado])

  const mergeRecomendacion = (nueva) => {
    setApiRecomendaciones((prev) => {
      const anteriores = prev ? prev.filter((r) => Number(r.producto_id) !== Number(nueva.producto_id)) : []
      return [...anteriores, nueva]
    })
  }

  const calcularUnProducto = async () => {
    if (!productoSeleccionado) {
      setError('Selecciona un producto primero.')
      return
    }
    setCargando(true)
    setError(null)
    try {
      const respuesta = await obtenerPrediccion(NEGOCIO_ID, { producto_id: productoSeleccionado, horizonte_dias: horizonteSeleccionado })
      mergeRecomendacion(respuesta)
      setView('Demanda')
    } catch (err) {
      const msg = err.message?.includes('__DB_ERR__')
        ? err.message.replace('__DB_ERR__', '')
        : err.message?.includes('__CONN_ERR__')
          ? err.message.replace('__CONN_ERR__', '')
          : err.message || 'No se pudo conectar con el servicio de prediccion.'
      setError(msg)
      if (onOpenModal) {
        onOpenModal({ eyebrow: 'Error de prediccion', title: 'No se pudo calcular', children: <p>{msg}</p> })
      }
    } finally {
      setCargando(false)
    }
  }

  const calcularConIA = async () => {
    setCargando(true)
    setError(null)
    try {
      const productosParaPredecir = inStockProducts.filter(p => p.backendId)
      if (productosParaPredecir.length === 0) {
        setError('No hay productos con ID de backend para predecir.')
        return
      }
      const respuestas = await Promise.all(productosParaPredecir.map((product) => obtenerPrediccion(NEGOCIO_ID, { producto_id: product.backendId, horizonte_dias: horizonteSeleccionado })))
      setApiRecomendaciones(respuestas)
      setView('Demanda')
    } catch (err) {
      const msg = err.message?.includes('__DB_ERR__')
        ? err.message.replace('__DB_ERR__', '')
        : err.message?.includes('__CONN_ERR__')
          ? err.message.replace('__CONN_ERR__', '')
          : err.message || 'No se pudo conectar con el servicio de prediccion.'
      setError(msg)
      if (onOpenModal) {
        onOpenModal({ eyebrow: 'Error de prediccion', title: 'No se pudo calcular', children: <p>{msg}</p> })
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

      {dataSource === 'empty' && (
        <div className="branch-insight" style={{ background: '#edf3fc', color: '#5175af', marginBottom: 16, borderRadius: 8, padding: '10px 16px', fontSize: 12 }}>
          <span>ℹ</span><span>Backend conectado pero sin productos. Crea productos o sube ventas para usar el modelo de prediccion.</span>
        </div>
      )}
      {dataSource === 'demo' && (
        <div className="branch-insight" style={{ background: '#fff8f0', color: '#aa741d', marginBottom: 16, borderRadius: 8, padding: '10px 16px', fontSize: 12 }}>
          <span>⚠</span><span>Backend no disponible. Mostrando datos de demostracion.</span>
        </div>
      )}

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
          <article><span>PRODUCTOS</span><strong>{inStockProducts.length}</strong><small>{dataSource === 'backend' ? 'en backend' : dataSource === 'empty' ? 'sin datos' : 'demo'}</small></article>
          <article><span>STOCK TOTAL</span><strong>{inStockProducts.reduce((s, p) => s + p.available, 0)} u.</strong><small>unidades</small></article>
          <article><span>EN RIESGO</span><strong>{inStockProducts.filter(p => p.risk === 'Critico' || p.risk === 'Bajo').length}</strong><small>requieren atencion</small></article>
        </div>

        {view === 'Resumen' && (
          <>
            <div className="panel" style={{ marginTop: 17, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <label className="branch-id-field" style={{ minWidth: 220 }}>
                <span>PRODUCTO</span>
                <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)}>
                  {inStockProducts.map((p) => (
                    <option key={p.id} value={p.backendId}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="branch-id-field" style={{ minWidth: 140 }}>
                <span>HORIZONTE</span>
                <select value={horizonteSeleccionado} onChange={(e) => setHorizonteSeleccionado(e.target.value)}>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </label>
              <button className="refresh-button" onClick={calcularUnProducto} disabled={cargando || !productoSeleccionado}>
                {cargando ? 'Calculando...' : 'Predecir este producto'}
              </button>
            </div>

            <div className="branch-insight">
              <span className="status-pulse" />
              <span>La sucursal tiene <strong>{inStockProducts.filter(p => p.risk === 'Critico' || p.risk === 'Bajo').length} productos en riesgo</strong>. Tambien puedes calcular la prediccion de todos los productos a la vez.</span>
              <button onClick={calcularConIA} disabled={cargando}>
                {cargando ? 'Calculando...' : 'Calcular todos con IA'} <Icon name="arrow" />
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="branch-insight" style={{ background: '#fee4de', color: '#c5684e' }}>
            <span>⚠</span>
            <span>{error}</span>
            <button onClick={calcularConIA}>Reintentar</button>
          </div>
        )}

        {view !== 'Resumen' && (
          <div className="branch-data-table">
            <div><span>PRODUCTO</span><span>{view === 'Stock' ? 'STOCK DISPONIBLE' : 'DEMANDA 15 DIAS'}</span><span>ESTADO</span></div>
            {inStockProducts.map((product) => {
              const recomendacion = apiRecomendaciones?.find((r) => Number(r.producto_id) === Number(product.backendId))
              return (
                <div key={product.id}>
                  <span><strong>{product.name}</strong><small>{product.sku}</small></span>
                  <strong>
                    {view === 'Stock'
                      ? `${product.available} u.`
                      : `${recomendacion ? recomendacion.cantidad_estimada : predictedDemand(product)} u.`}
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
