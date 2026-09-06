import { crearProducto } from '../routes/api'

export const NEGOCIO_ID_DEMO = 1

export async function sembrarDatosDemo(productos) {
  const resultados = { creados: 0, errores: 0 }
  for (const producto of productos) {
    try {
      await crearProducto(NEGOCIO_ID_DEMO, { nombre: producto.name, precio_unitario: producto.price || 10, stock_actual: producto.available })
      resultados.creados++
    } catch {
      resultados.errores++
    }
  }
  return resultados
}
