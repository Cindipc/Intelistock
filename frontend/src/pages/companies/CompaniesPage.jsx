import { useEffect, useState } from 'react'
import { listarProductos, listarVentas, normalizarProducto } from '../../routes/api'

const NEGOCIO_ID = 1

export default function CompaniesPage() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([listarProductos(NEGOCIO_ID), listarVentas(NEGOCIO_ID)])
      .then(([productData, salesData]) => {
        setProducts(Array.isArray(productData) ? productData.map(normalizarProducto) : [])
        setSales(Array.isArray(salesData) ? salesData : [])
      })
      .catch((requestError) => setError(requestError.message))
  }, [])

  const stockTotal = products.reduce((total, product) => total + product.available, 0)
  const inventoryValue = products.reduce((total, product) => total + product.available * product.precio_unitario, 0)

  return (
    <div className="page-content workspace-page">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">NEGOCIO ACTIVO · ID {NEGOCIO_ID}</p>
          <h1>Mi negocio</h1>
          <p className="subtitle">Consulta el inventario y la actividad conectados a tu cuenta.</p>
        </div>
      </div>

      <section className="workspace-cards">
        <article className="workspace-card"><span>PRODUCTOS EN CATALOGO</span><strong>{products.length}</strong><small>Registrados en el backend</small></article>
        <article className="workspace-card"><span>STOCK DISPONIBLE</span><strong>{stockTotal}</strong><small>Unidades actuales</small></article>
        <article className="workspace-card"><span>VENTAS REGISTRADAS</span><strong>{sales.length}</strong><small>Movimientos históricos</small></article>
      </section>

      <section className="workspace-table">
        <div className="table-header">
          <div>
            <p className="panel-kicker">INVENTARIO DEL NEGOCIO</p>
            <h2>Productos activos</h2>
          </div>
          <strong>${inventoryValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</strong>
        </div>
        {error && <p className="subtitle">{error}</p>}
        {!error && products.length === 0 && <p className="subtitle">No hay productos registrados para este negocio.</p>}
        {products.map((product, index) => (
          <div className="workspace-row" key={product.id}>
            <span className="row-number">0{index + 1}</span>
            <strong>{product.name}</strong>
            <span>{product.category}</span>
            <b className={`row-status ${product.available > 5 ? 'good' : ''}`}>{product.risk}</b>
            <span className="company-trend">{product.available} u.</span>
          </div>
        ))}
      </section>
    </div>
  )
}
