import pandas as pd
from ml.src.schema import DatosEntrenamiento


def construir_stock_diario(
    movimientos_stock: list, fecha_inicio, fecha_fin
) -> pd.DataFrame:
    """Reconstruye el stock por producto por día a partir de entradas/salidas."""
    df = pd.DataFrame([m.model_dump() for m in movimientos_stock])
    if df.empty:
        return pd.DataFrame(columns=["producto_id", "fecha", "stock"])

    df["delta"] = df.apply(
        lambda r: r["cantidad"] if r["tipo"] == "entrada" else -r["cantidad"], axis=1
    )

    resultados = []
    for producto_id, grupo in df.groupby("producto_id"):
        grupo = grupo.sort_values("fecha")
        rango_fechas = pd.date_range(fecha_inicio, fecha_fin, freq="D")
        stock_por_fecha = (
            grupo.groupby("fecha")["delta"]
            .sum()
            .reindex(rango_fechas, fill_value=0)
            .cumsum()  # suma acumulada
        )
        temp = pd.DataFrame(
            {
                "producto_id": producto_id,
                "fecha": rango_fechas,
                "stock": stock_por_fecha.values,
            }
        )
        resultados.append(temp)

    return pd.concat(resultados, ignore_index=True)


def construir_dataset(datos: DatosEntrenamiento) -> pd.DataFrame:
    """Une ventas + stock reconstruido, genera features base para entrenar."""
    ventas_df = pd.DataFrame([v.model_dump() for v in datos.ventas])
    ventas_df["fecha"] = pd.to_datetime(ventas_df["fecha"])

    fecha_inicio = ventas_df["fecha"].min()
    fecha_fin = ventas_df["fecha"].max()

    stock_df = construir_stock_diario(datos.movimientos_stock, fecha_inicio, fecha_fin)
    stock_df["fecha"] = pd.to_datetime(stock_df["fecha"])

    df = ventas_df.merge(stock_df, on=["producto_id", "fecha"], how="left")
    df["stock"] = df["stock"].fillna(0)

    # Filtrar días donde el negocio no operó: no representan demanda real
    df = df[df["negocio_abierto"] == True].copy()

    # Marcar posible demanda censurada (se quedó sin stock)
    df["stock_agotado"] = df["stock"] <= 0

    # Features de calendario
    df["dia_semana"] = df["fecha"].dt.dayofweek
    df["dia_mes"] = df["fecha"].dt.day
    df["mes"] = df["fecha"].dt.month
    df["es_fin_semana"] = df["dia_semana"].isin([5, 6]).astype(int)

    # Features de rezago (lag) por producto: venta de días anteriores
    df = df.sort_values(["producto_id", "fecha"])
    for lag in [1, 7, 14]:
        df[f"venta_lag_{lag}"] = df.groupby("producto_id")["cantidad_vendida"].shift(
            lag
        )

    # Media móvil de ventas (tendencia reciente)
    df["media_movil_7"] = df.groupby("producto_id")["cantidad_vendida"].transform(
        lambda x: x.rolling(window=7, min_periods=1).mean()
    )

    return df


def contar_registros_por_producto(df: pd.DataFrame) -> dict:
    """Cuenta cuántas filas de venta tiene cada producto, para decidir
    en train.py si usa Random Forest o fallback."""
    return df.groupby("producto_id")["fecha"].count().to_dict()


MINIMO_DIAS_HISTORIAL = 30
RECOMENDADO_DIAS_HISTORIAL = 90


def puede_entrenar(datos: "DatosEntrenamiento") -> dict:
    """Valida si un negocio tiene suficiente historial para entrenar.
    Se debe llamar ANTES de invocar entrenar_modelo()."""
    if not datos.ventas:
        return {
            "puede_entrenar": False,
            "razon": "No hay ventas registradas.",
            "dias_historial": 0,
        }

    fechas = [v.fecha for v in datos.ventas]
    dias_historial = (max(fechas) - min(fechas)).days + 1

    if dias_historial < MINIMO_DIAS_HISTORIAL:
        return {
            "puede_entrenar": False,
            "razon": f"Se requieren al menos {MINIMO_DIAS_HISTORIAL} dias de historial, "
            f"solo hay {dias_historial}.",
            "dias_historial": dias_historial,
        }

    advertencia = None
    if dias_historial < RECOMENDADO_DIAS_HISTORIAL:
        advertencia = (
            f"Tienes {dias_historial} dias de historial. "
            f"Se recomiendan {RECOMENDADO_DIAS_HISTORIAL} para mayor precision."
        )

    return {
        "puede_entrenar": True,
        "razon": None,
        "advertencia": advertencia,
        "dias_historial": dias_historial,
    }
