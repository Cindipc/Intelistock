const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TIMEOUT_MS = 15000

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let response
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
      ...options,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('La API tardo demasiado en responder. Intenta de nuevo.', { cause: err })
    }
    throw new Error('No se pudo conectar con la API. Verifica que el backend este corriendo.', { cause: err })
  }
  clearTimeout(timeoutId)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.detail || data?.message || `Error ${response.status} en la API`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  return data
}

export const listarProductos = (negocioId) => request(`/negocios/${negocioId}/productos`)
export const crearProducto = (negocioId, producto) => request(`/negocios/${negocioId}/productos`, { method: 'POST', body: JSON.stringify(producto) })
export const editarProducto = (negocioId, productoId, producto) => request(`/negocios/${negocioId}/productos/${productoId}`, { method: 'PUT', body: JSON.stringify(producto) })
export const eliminarProducto = (negocioId, productoId) => request(`/negocios/${negocioId}/productos/${productoId}`, { method: 'DELETE' })
export const registrarVenta = (negocioId, venta) => request(`/negocios/${negocioId}/ventas`, { method: 'POST', body: JSON.stringify(venta) })
export const registrarVentasLote = (negocioId, ventas) => request(`/negocios/${negocioId}/ventas/lote`, { method: 'POST', body: JSON.stringify(ventas) })
export const listarVentas = (negocioId) => request(`/negocios/${negocioId}/ventas`)
export const registrarMovimiento = (negocioId, movimiento) => request(`/negocios/${negocioId}/movimientos`, { method: 'POST', body: JSON.stringify(movimiento) })
export const listarMovimientos = (negocioId) => request(`/negocios/${negocioId}/movimientos`)
export const estadoHistorico = (negocioId) => request(`/negocios/${negocioId}/historico/estado`)
export const entrenarConDatosGuardados = (negocioId) => request(`/negocios/${negocioId}/entrenar-con-datos-guardados`, { method: 'POST' })
export const obtenerPrediccion = (negocioId, solicitud) => request(`/negocios/${negocioId}/predicciones`, { method: 'POST', body: JSON.stringify(solicitud) })
export const obtenerRecomendacionesCompra = (negocioId, horizonteDias = '15') => request(`/negocios/${negocioId}/recomendaciones-compra?horizonte_dias=${horizonteDias}`)

const api = { listarProductos, crearProducto, editarProducto, eliminarProducto, registrarVenta, registrarVentasLote, listarVentas, registrarMovimiento, listarMovimientos, estadoHistorico, entrenarConDatosGuardados, obtenerPrediccion, obtenerRecomendacionesCompra }
export default api
