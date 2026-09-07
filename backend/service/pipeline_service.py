"""
Puente entre Postgres (tablas ventas/venta_detalle/inventario_movimientos)
y el modulo ml/ (que trabaja con los schemas VentaHistorica, MovimientoStock, etc.)

Este archivo NO modifica nada de backend/ml/src/ -- solo arma los objetos
que ese modulo espera, a partir de datos reales de la base de datos.
"""

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from models.db_models import Venta, VentaDetalle, InventarioMovimiento, Producto
from ml.src.schema import (
    VentaHistorica,
    MovimientoStock,
    DatosEntrenamiento,
    SolicitudPrediccion,
    ResultadoPrediccion,
)
from ml.src.preprocessing import puede_entrenar, construir_dataset
from ml.src.train import entrenar_modelo as ml_entrenar_modelo
from ml.src.predict import predecir as ml_predecir


def _obtener_ventas_diarias(negocio_id: int, db: Session) -> list[VentaHistorica]:
    """
    ventas + venta_detalle guardan una fila POR LINEA de ticket.
    El modulo ml/ espera una fila POR DIA POR PRODUCTO (cantidad_vendida ya sumada).
    Aqui se agrupa con SQL para no traer de mas.
    """
    filas = (
        db.query(
            VentaDetalle.producto_id,
            func.date(Venta.fecha_hora).label("fecha"),
            func.sum(VentaDetalle.cantidad).label("cantidad_vendida"),
        )
        .join(Venta, Venta.venta_id == VentaDetalle.venta_id)
        .filter(Venta.negocio_id == negocio_id)
        .group_by(VentaDetalle.producto_id, func.date(Venta.fecha_hora))
        .all()
    )

    return [
        VentaHistorica(
            negocio_id=str(negocio_id),
            producto_id=str(fila.producto_id),
            fecha=fila.fecha,
            cantidad_vendida=int(fila.cantidad_vendida),
            negocio_abierto=True,  # el esquema actual no registra dias de cierre
        )
        for fila in filas
    ]


def _obtener_movimientos(negocio_id: int, db: Session) -> list[MovimientoStock]:
    """
    inventario_movimientos tiene tipo 'entrada' | 'salida' | 'ajuste'.
    El modulo ml/ solo entiende 'entrada' | 'salida', asi que los ajustes
    se descartan aqui (no se inventa un signo para no ensuciar el stock reconstruido).
    """
    filas = (
        db.query(InventarioMovimiento)
        .join(Producto, Producto.producto_id == InventarioMovimiento.producto_id)
        .filter(
            Producto.negocio_id == negocio_id,
            InventarioMovimiento.tipo_movimiento.in_(["entrada", "salida"]),
        )
        .all()
    )

    return [
        MovimientoStock(
            negocio_id=str(negocio_id),
            producto_id=str(m.producto_id),
            fecha=m.fecha_hora.date(),
            tipo=m.tipo_movimiento,
            cantidad=int(m.cantidad),
        )
        for m in filas
    ]


def construir_datos_entrenamiento(negocio_id: int, db: Session) -> DatosEntrenamiento:
    return DatosEntrenamiento(
        negocio_id=str(negocio_id),
        ventas=_obtener_ventas_diarias(negocio_id, db),
        movimientos_stock=_obtener_movimientos(negocio_id, db),
    )


def validar_historico(negocio_id: int, db: Session) -> dict:
    datos = construir_datos_entrenamiento(negocio_id, db)
    return puede_entrenar(datos)


def entrenar_modelo(negocio_id: int, db: Session) -> dict:
    datos = construir_datos_entrenamiento(negocio_id, db)
    validacion = puede_entrenar(datos)
    if not validacion["puede_entrenar"]:
        raise ValueError(validacion["razon"])

    resumen = ml_entrenar_modelo(datos)
    return {"validacion": validacion, "resumen_entrenamiento": resumen}


def predecir_producto(
    negocio_id: int, producto_id: int, horizonte_dias: str, db: Session
) -> ResultadoPrediccion:
    datos = construir_datos_entrenamiento(negocio_id, db)
    df_procesado = construir_dataset(datos)

    ultimos_datos = df_procesado[
        df_procesado["producto_id"] == str(producto_id)
    ].sort_values("fecha")

    solicitud = SolicitudPrediccion(
        negocio_id=str(negocio_id),
        producto_id=str(producto_id),
        horizonte_dias=horizonte_dias,
    )

    if ultimos_datos.empty:
        return ResultadoPrediccion(
            producto_id=str(producto_id),
            horizonte_dias=int(horizonte_dias),
            cantidad_estimada=0.0,
            confianza="sin_datos",
            metodo_usado="ninguno",
        )

    return ml_predecir(solicitud, ultimos_datos)
