import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error

from ml.src.preprocessing import construir_dataset, contar_registros_por_producto
from ml.src.schema import DatosEntrenamiento

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

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

UMBRAL_FALLBACK = 20
UMBRAL_CONFIANZA_ALTA = 45


def _confianza(n_registros: int) -> str:
    if n_registros < UMBRAL_FALLBACK:
        return "baja"
    elif n_registros < UMBRAL_CONFIANZA_ALTA:
        return "media"
    return "alta"


def _entrenar_fallback(serie_ventas: pd.Series) -> dict:
    """Suavizado exponencial simple: promedio ponderado dando más peso a lo reciente."""
    valores = serie_ventas.dropna().values
    if len(valores) == 0:
        return {"tipo": "fallback_suavizado", "valor_promedio": 0.0}

    alpha = 0.3
    nivel = valores[0]
    for v in valores[1:]:
        nivel = alpha * v + (1 - alpha) * nivel

    return {"tipo": "fallback_suavizado", "valor_promedio": float(nivel)}


def _entrenar_random_forest(df_producto: pd.DataFrame) -> dict:
    df_producto = df_producto.dropna(subset=FEATURES + [TARGET])

    X = df_producto[FEATURES]
    y = df_producto[TARGET]

    modelo = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=3,
        random_state=42,
    )

    # Validación respetando el orden temporal (no mezclar futuro con pasado)
    tscv = TimeSeriesSplit(n_splits=3)
    errores = []
    for train_idx, test_idx in tscv.split(X):
        modelo_temp = RandomForestRegressor(
            n_estimators=200, max_depth=8, min_samples_leaf=3, random_state=42
        )
        modelo_temp.fit(X.iloc[train_idx], y.iloc[train_idx])
        pred = modelo_temp.predict(X.iloc[test_idx])
        errores.append(mean_absolute_error(y.iloc[test_idx], pred))

    modelo.fit(X, y)  # entrenar versión final con todos los datos

    return {
        "tipo": "random_forest",
        "modelo": modelo,
        "mae_promedio": float(np.mean(errores)) if errores else None,
    }


def entrenar_modelo(datos: DatosEntrenamiento) -> dict:
    df = construir_dataset(datos)
    conteo = contar_registros_por_producto(df)

    resumen = {}
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    for producto_id, n_registros in conteo.items():
        df_producto = df[df["producto_id"] == producto_id]
        confianza = _confianza(n_registros)

        if n_registros < UMBRAL_FALLBACK:
            resultado = _entrenar_fallback(df_producto[TARGET])
        else:
            resultado = _entrenar_random_forest(df_producto)

        path_archivo = MODELS_DIR / f"modelo_{datos.negocio_id}_{producto_id}.joblib"
        joblib.dump(resultado, path_archivo)

        resumen[producto_id] = {
            "n_registros": n_registros,
            "confianza": confianza,
            "metodo": resultado["tipo"],
            "mae": resultado.get("mae_promedio"),
            "path": str(path_archivo),
        }

    return resumen
