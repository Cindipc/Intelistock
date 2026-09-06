from datetime import date
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session
from models.db_models import InventarioMovimiento, Venta, VentaDetalle
from ml.src.predict import predecir
from ml.src.preprocessing import construir_dataset, puede_entrenar
from ml.src.schema import (
    DatosEntrenamiento,
    HorizontePrediccion,
    MovimientoStock,
    SolicitudPrediccion,
    VentaHistorica,
)
from ml.src.train import entrenar_modelo as entrenar_modelos_ml


def construir_datos_entrenamiento(negocio_id: int, db: Session) -> DatosEntrenamiento:
    query = (
        db.query(
            Venta.fecha_hora,
            VentaDetalle.producto_id,
            VentaDetalle.cantidad,
            VentaDetalle.precio_unitario_venta,
        )
        .join(VentaDetalle)
        .filter(Venta.negocio_id == negocio_id)
    )

    ventas = [
        VentaHistorica(
            negocio_id=str(negocio_id),
            producto_id=str(row.producto_id),
            fecha=pd.Timestamp(row.fecha_hora).date(),
            cantidad_vendida=int(row.cantidad),
        )
        for row in query.all()
    ]
    movimientos = [
        MovimientoStock(
            negocio_id=str(row.negocio_id),
            producto_id=str(row.producto_id),
            fecha=row.fecha,
            tipo=row.tipo,
            cantidad=row.cantidad,
        )
        for row in db.query(InventarioMovimiento)
        .filter(InventarioMovimiento.negocio_id == negocio_id)
        .all()
    ]
    return DatosEntrenamiento(
        negocio_id=str(negocio_id), ventas=ventas, movimientos_stock=movimientos
    )


def entrenar_modelo(negocio_id: int, db: Session) -> dict:
    datos = construir_datos_entrenamiento(negocio_id, db)
    validacion = puede_entrenar(datos)
    if not validacion["puede_entrenar"]:
        raise ValueError(validacion["razon"])

    resumen = entrenar_modelos_ml(datos)
    return {
        "mensaje": "Modelos entrenados",
        "negocio_id": negocio_id,
        "dias_historial": validacion["dias_historial"],
        "advertencia": validacion.get("advertencia"),
        "productos": resumen,
    }


def predecir_producto(negocio_id: int, producto_id: int, dias: int, db: Session):
    if dias not in {7, 15, 30}:
        raise ValueError("El horizonte debe ser de 7, 15 o 30 días")

    datos = construir_datos_entrenamiento(negocio_id, db)
    dataset = construir_dataset(datos)
    historico = dataset[dataset["producto_id"] == str(producto_id)].sort_values("fecha")
    if historico.empty:
        historico = dataset[dataset["producto_id"] == producto_id].sort_values("fecha")
    if historico.empty:
        raise ValueError("No hay historial para el producto solicitado")

    solicitud = SolicitudPrediccion(
        negocio_id=str(negocio_id),
        producto_id=str(producto_id),
        horizonte_dias=HorizontePrediccion(str(dias)),
    )
    return predecir(solicitud, historico)
