"""
CRUD MINIMO EN MEMORIA - temporal mientras no existe Postgres.
Todo se guarda en diccionarios de Python (se pierde al reiniciar el servidor).
Cuando la BD este lista, este archivo se reemplaza por consultas reales,
SIN cambiar las rutas ni el frontend.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ml.src.schema import VentaHistorica, MovimientoStock, DatosEntrenamiento
from ml.src.train import entrenar_modelo
from ml.src.preprocessing import puede_entrenar

router = APIRouter()

DB = {
    "productos": {},
    "ventas": {},
    "movimientos": {},
    "resumen_entrenamiento": {},
}


def _init_negocio(negocio_id: str):
    DB["productos"].setdefault(negocio_id, {})
    DB["ventas"].setdefault(negocio_id, [])
    DB["movimientos"].setdefault(negocio_id, [])


class ProductoCrear(BaseModel):
    nombre: str
    sku: str
    categoria: str
    stock_actual: int = 0
    stock_minimo: int = 0


@router.get("/{negocio_id}/productos")
def listar_productos(negocio_id: str):
    _init_negocio(negocio_id)
    return list(DB["productos"][negocio_id].values())


@router.post("/{negocio_id}/productos")
def crear_producto(negocio_id: str, producto: ProductoCrear):
    _init_negocio(negocio_id)
    producto_id = producto.sku
    if producto_id in DB["productos"][negocio_id]:
        raise HTTPException(400, f"Ya existe un producto con SKU {producto_id}")
    DB["productos"][negocio_id][producto_id] = {"producto_id": producto_id, **producto.model_dump()}
    return DB["productos"][negocio_id][producto_id]


@router.put("/{negocio_id}/productos/{producto_id}")
def editar_producto(negocio_id: str, producto_id: str, producto: ProductoCrear):
    _init_negocio(negocio_id)
    if producto_id not in DB["productos"][negocio_id]:
        raise HTTPException(404, "Producto no encontrado")
    DB["productos"][negocio_id][producto_id] = {"producto_id": producto_id, **producto.model_dump()}
    return DB["productos"][negocio_id][producto_id]


@router.delete("/{negocio_id}/productos/{producto_id}")
def eliminar_producto(negocio_id: str, producto_id: str):
    _init_negocio(negocio_id)
    if producto_id not in DB["productos"][negocio_id]:
        raise HTTPException(404, "Producto no encontrado")
    del DB["productos"][negocio_id][producto_id]
    return {"eliminado": producto_id}


@router.post("/{negocio_id}/ventas")
def registrar_venta(negocio_id: str, venta: VentaHistorica):
    _init_negocio(negocio_id)
    if venta.negocio_id != negocio_id:
        raise HTTPException(400, "negocio_id no coincide")
    DB["ventas"][negocio_id].append(venta.model_dump())
    return {"guardado": True, "total_ventas": len(DB["ventas"][negocio_id])}


@router.post("/{negocio_id}/ventas/lote")
def registrar_ventas_lote(negocio_id: str, ventas: list[VentaHistorica]):
    _init_negocio(negocio_id)
    for venta in ventas:
        if venta.negocio_id != negocio_id:
            raise HTTPException(400, "negocio_id no coincide en alguna fila")
        DB["ventas"][negocio_id].append(venta.model_dump())
    return {"guardadas": len(ventas), "total_ventas": len(DB["ventas"][negocio_id])}


@router.get("/{negocio_id}/ventas")
def listar_ventas(negocio_id: str):
    _init_negocio(negocio_id)
    return DB["ventas"][negocio_id]


@router.post("/{negocio_id}/movimientos")
def registrar_movimiento(negocio_id: str, movimiento: MovimientoStock):
    _init_negocio(negocio_id)
    if movimiento.negocio_id != negocio_id:
        raise HTTPException(400, "negocio_id no coincide")
    DB["movimientos"][negocio_id].append(movimiento.model_dump())
    producto = DB["productos"][negocio_id].get(movimiento.producto_id)
    if producto:
        delta = movimiento.cantidad if movimiento.tipo == "entrada" else -movimiento.cantidad
        producto["stock_actual"] = producto.get("stock_actual", 0) + delta
    return {"guardado": True, "total_movimientos": len(DB["movimientos"][negocio_id])}


@router.get("/{negocio_id}/movimientos")
def listar_movimientos(negocio_id: str):
    _init_negocio(negocio_id)
    return DB["movimientos"][negocio_id]


def _construir_datos_entrenamiento(negocio_id: str) -> DatosEntrenamiento:
    _init_negocio(negocio_id)
    return DatosEntrenamiento(
        negocio_id=negocio_id,
        ventas=[VentaHistorica(**v) for v in DB["ventas"][negocio_id]],
        movimientos_stock=[MovimientoStock(**m) for m in DB["movimientos"][negocio_id]],
    )


@router.post("/{negocio_id}/entrenar-con-datos-guardados")
def entrenar_con_datos_guardados(negocio_id: str):
    datos = _construir_datos_entrenamiento(negocio_id)
    validacion = puede_entrenar(datos)
    if not validacion["puede_entrenar"]:
        raise HTTPException(422, validacion["razon"])
    resumen = entrenar_modelo(datos)
    DB["resumen_entrenamiento"][negocio_id] = resumen
    return {"validacion": validacion, "resumen_entrenamiento": resumen}


@router.get("/{negocio_id}/historico/estado")
def estado_historico(negocio_id: str):
    datos = _construir_datos_entrenamiento(negocio_id)
    return puede_entrenar(datos)
