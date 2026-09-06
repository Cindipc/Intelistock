import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error

from ml.src.preprocessing import construir_dataset, contar_registros_por_producto
from ml.src.schema import DatosEntrenamiento

FEATURES = [
    "dia_semana",
    "dia_mes",
    "mes",
    "es_fin_semana",
    "venta_lag_1",
    "venta_lag_7",
    "venta_lag_14",
    "media_movil_7",
    "stock",
    "stock_agotado",
]
TARGET = "cantidad_vendida"


def _baseline_promedio_simple(y_train: pd.Series, y_test: pd.Series) -> float:
    """Baseline ingenuo: predice siempre el promedio historico.
    Sirve para saber si el modelo real aporta algo sobre no usar ML."""
    prediccion_constante = y_train.mean()
    predicciones = np.full(len(y_test), prediccion_constante)
    return mean_absolute_error(y_test, predicciones)


def comparar_contra_baseline(df_producto: pd.DataFrame, mae_modelo: float) -> dict:
    """Compara el MAE del modelo real contra el baseline de 'promedio simple'.
    Un modelo util deberia tener MAE menor al baseline."""
    df_producto = df_producto.dropna(subset=FEATURES + [TARGET]).sort_values("fecha")

    corte = int(len(df_producto) * 0.8)
    y_train = df_producto[TARGET].iloc[:corte]
    y_test = df_producto[TARGET].iloc[corte:]

    if len(y_test) == 0 or mae_modelo is None:
        return {"mae_baseline": None, "mejora_pct": None, "supera_baseline": None}

    mae_baseline = _baseline_promedio_simple(y_train, y_test)

    if mae_baseline == 0:
        mejora_pct = 0.0
    else:
        mejora_pct = round((1 - mae_modelo / mae_baseline) * 100, 1)

    return {
        "mae_baseline": round(mae_baseline, 3),
        "mejora_pct": mejora_pct,
        "supera_baseline": mae_modelo < mae_baseline,
    }


def generar_reporte(
    datos: DatosEntrenamiento, resumen_entrenamiento: dict
) -> pd.DataFrame:
    """Genera un reporte tabular con el estado de todos los modelos de un negocio,
    comparados contra el baseline. Pensado para mostrarle al equipo o loguear."""
    df = construir_dataset(datos)
    filas = []

    for producto_id, info in resumen_entrenamiento.items():
        df_producto = df[df["producto_id"] == producto_id]
        comparacion = comparar_contra_baseline(df_producto, info.get("mae"))

        filas.append(
            {
                "producto_id": producto_id,
                "n_registros": info["n_registros"],
                "metodo": info["metodo"],
                "confianza": info["confianza"],
                "mae_modelo": info.get("mae"),
                **comparacion,
            }
        )

    return pd.DataFrame(filas)
