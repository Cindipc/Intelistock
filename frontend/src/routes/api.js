const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TIMEOUT_MS = 15000

function negocioParam(negocioId) {
  const value = Number(negocioId)
  if (!Number.isInteger(value)) throw new Error('El backend actual requiere un negocio_id numerico.')
  return value
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response
  try {
    response = await fetch(url, {
      headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) },
      signal: controller.signal,
      ...options,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('La API tardo demasiado en responder.', { cause: err })
    }
    throw new Error('__CONN_ERR__No se pudo conectar con el backend. Verifica que este corriendo en ' + API_BASE_URL, { cause: err })
  }
  clearTimeout(timeoutId)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('__DB_ERR__' + (data?.detail || 'Base de datos no disponible. El backend funciona pero no puede acceder a PostgreSQL.'))
    }
    const message = data?.detail || data?.message || `Error ${response.status} en la API`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  return data
}

export const checkHealth = () => request('/health')

export const listarProductos = (negocioId) => request(`/productos/?negocio_id=${negocioParam(negocioId)}`)
export const crearProducto = (negocioId, producto) => request('/productos/', { method: 'POST', body: JSON.stringify({ negocio_id: negocioParam(negocioId), categoria_id: producto.categoria_id ?? null, nombre: producto.nombre, precio_unitario: producto.precio_unitario ?? 0, stock_actual: producto.stock_actual ?? 0 }) })
export const editarProducto = (negocioId, productoId, producto) => request(`/productos/${productoId}`, { method: 'PATCH', body: JSON.stringify({ nombre: producto.nombre, precio_unitario: producto.precio_unitario, stock_actual: producto.stock_actual }) })
export const eliminarProducto = (negocioId, productoId) => request(`/productos/${productoId}`, { method: 'DELETE' })
export const listarVentas = (negocioId) => request(`/ventas/?negocio_id=${negocioParam(negocioId)}`)
export const eliminarVenta = (ventaId) => request(`/ventas/${ventaId}`, { method: 'DELETE' })
export const entrenarConDatosGuardados = (negocioId) => request(`/ml/entrenar?negocio_id=${negocioParam(negocioId)}`, { method: 'POST' })

export const obtenerPrediccion = async (negocioId, solicitud) => {
  const productoId = Number(solicitud.producto_id)
  const dias = Number(solicitud.dias ?? solicitud.horizonte_dias ?? 7)
  return request('/ml/predecir', { method: 'POST', body: JSON.stringify({ negocio_id: negocioParam(negocioId), producto_id: productoId, dias }) })
}

export const importarVentas = (negocioId, archivo) => { const formData = new FormData(); formData.append('archivo', archivo); return request(`/importacion/ventas?negocio_id=${negocioParam(negocioId)}`, { method: 'POST', body: formData }) }

export function normalizarProducto(producto, index = 0) {
  const tonos = ['coral', 'blue', 'yellow', 'green']
  const risk = producto.stock_actual <= 5 ? 'Critico' : producto.stock_actual <= 15 ? 'Bajo' : 'Saludable'
  return { ...producto, id: String(producto.producto_id), backendId: producto.producto_id, name: producto.nombre, sku: `PROD-${producto.producto_id}`, category: producto.categoria_id ? `Categoria ${producto.categoria_id}` : 'Sin categoria', available: producto.stock_actual, precio_unitario: Number(producto.precio_unitario) || 0, minimum: 10, sold30: 0, demand7: 0, demand15: 0, demand30: 0, coverage: 0, risk, tone: tonos[index % tonos.length], avatar: producto.nombre.slice(0, 2).toUpperCase(), trend: '0%', action: risk === 'Critico' || risk === 'Bajo' ? 'Revisar reposicion' : 'Mantener seguimiento', reason: 'Producto cargado desde el catalogo del backend.' }
}

export function normalizarVenta(venta) {
  return {
    id: venta.venta_id ?? venta.id,
    fecha: venta.fecha_hora ?? venta.fecha,
    total: Number(venta.total) || 0,
    negocio_id: venta.negocio_id,
  }
}

const api = { checkHealth, listarProductos, crearProducto, editarProducto, eliminarProducto, listarVentas, eliminarVenta, entrenarConDatosGuardados, obtenerPrediccion, importarVentas }
export default api
