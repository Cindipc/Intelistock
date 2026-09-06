import { registrarVentasLote, registrarMovimiento, crearProducto } from '../routes/api'

export const NEGOCIO_ID_DEMO = 1

function generarVentasSimuladas(producto, dias = 90) {
  const ventas = []
  const hoy = new Date()
  const ventaBase = Math.max(1, Math.round(producto.sold30 / 30))
  for (let i = dias; i >= 0; i--) {
    const fecha = new Date(hoy)
    fecha.setDate(fecha.getDate() - i)
    const esDomingo = fecha.getDay() === 0
    const ruido = Math.round((Math.random() - 0.5) * ventaBase * 0.6)
    const cantidad = esDomingo ? 0 : Math.max(0, ventaBase + ruido)
    ventas.push({ negocio_id: NEGOCIO_ID_DEMO, producto_id: producto.sku, fecha: fecha.toISOString().split('T')[0], cantidad_vendida: cantidad, negocio_abierto: !esDomingo })
  }
  return ventas
}

export async function sembrarDatosDemo(productos) {
  for (const producto of productos) {
    try {
      await crearProducto(NEGOCIO_ID_DEMO, { nombre: producto.name, sku: producto.sku, categoria: producto.category, stock_actual: producto.available, stock_minimo: producto.minimum })
    } catch (err) {
      if (!err.message.includes('Ya existe')) throw err
    }
  }
  for (const producto of productos) {
    const ventas = generarVentasSimuladas(producto)
    await registrarVentasLote(NEGOCIO_ID_DEMO, ventas)
  }
  for (const producto of productos) {
    await registrarMovimiento(NEGOCIO_ID_DEMO, { negocio_id: NEGOCIO_ID_DEMO, producto_id: producto.sku, fecha: new Date().toISOString().split('T')[0], tipo: 'entrada', cantidad: producto.minimum * 2 })
  }
}
