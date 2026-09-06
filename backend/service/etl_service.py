import pandas as pd
from sqlalchemy.orm import Session
from models.db_models import Producto, Venta, VentaDetalle

COLUMNAS_ESPERADAS = {"fecha", "producto", "cantidad", "precio_unitario"}


def validar_columnas(df: pd.DataFrame):
    faltantes = COLUMNAS_ESPERADAS - set(df.columns.str.lower())
    if faltantes:
        raise ValueError(f"Faltan columnas requeridas: {faltantes}")


def limpiar_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = df.columns.str.lower().str.strip()
    df = df.dropna(subset=["fecha", "producto", "cantidad", "precio_unitario"])
    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce")
    df["cantidad"] = pd.to_numeric(df["cantidad"], errors="coerce")
    df["precio_unitario"] = pd.to_numeric(df["precio_unitario"], errors="coerce")
    df = df.dropna()
    return df


def insertar_ventas_desde_df(df: pd.DataFrame, negocio_id: int, db: Session) -> dict:
    filas_insertadas = 0
    filas_omitidas = 0

    for fecha, grupo in df.groupby(df["fecha"].dt.date):
        total_venta = float((grupo["cantidad"] * grupo["precio_unitario"]).sum())
        venta = Venta(negocio_id=negocio_id, fecha_hora=fecha, total=total_venta)
        db.add(venta)
        db.flush()

        for _, fila in grupo.iterrows():
            producto = (
                db.query(Producto)
                .filter(
                    Producto.nombre == fila["producto"],
                    Producto.negocio_id == negocio_id,
                )
                .first()
            )

            if not producto:
                filas_omitidas += 1
                continue

            detalle = VentaDetalle(
                venta_id=venta.venta_id,
                producto_id=producto.producto_id,
                cantidad=int(fila["cantidad"]),
                precio_unitario_venta=float(fila["precio_unitario"]),
            )
            db.add(detalle)
            filas_insertadas += 1

    db.commit()
    return {"insertadas": filas_insertadas, "omitidas": filas_omitidas}
