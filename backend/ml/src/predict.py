import joblib
import pandas as pd
from pathlib import Path
from datetime import date, timedelta

from ml.src.schema import SolicitudPrediccion, ResultadoPrediccion

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


def _cargar_artefacto(negocio_id: str, producto_id: str) -> dict:
    """En producción, esta ruta debería venir de la tabla `modelos_entrenados`
    en vez de reconstruirse aquí. Por ahora, mientras no está esa integración,
    se arma la ruta directo."""
    path_archivo = MODELS_DIR / f"modelo_{negocio_id}_{producto_id}.joblib"
    if not path_archivo.exists():
        raise FileNotFoundError(
            f"No existe modelo entrenado para negocio={negocio_id}, producto={producto_id}"
        )
    return joblib.load(path_archivo)


def _construir_features_futuros(
    fecha_objetivo: date, ultimos_datos: pd.DataFrame
) -> pd.DataFrame:
    """Construye la fila de features para la fecha a predecir,
    usando los últimos datos históricos disponibles del producto."""
    fila = {
        "dia_semana": fecha_objetivo.weekday(),
        "dia_mes": fecha_objetivo.day,
        "mes": fecha_objetivo.month,
        "es_fin_semana": int(fecha_objetivo.weekday() in [5, 6]),
        "venta_lag_1": ultimos_datos["cantidad_vendida"].iloc[-1],
        "venta_lag_7": (
            ultimos_datos["cantidad_vendida"].iloc[-7]
            if len(ultimos_datos) >= 7
            else ultimos_datos["cantidad_vendida"].mean()
        ),
        "venta_lag_14": (
            ultimos_datos["cantidad_vendida"].iloc[-14]
            if len(ultimos_datos) >= 14
            else ultimos_datos["cantidad_vendida"].mean()
        ),
        "media_movil_7": ultimos_datos["cantidad_vendida"].tail(7).mean(),
        "stock": ultimos_datos["stock"].iloc[-1],
        "stock_agotado": int(ultimos_datos["stock"].iloc[-1] <= 0),
    }
    return pd.DataFrame([fila])


def predecir(
    solicitud: SolicitudPrediccion, ultimos_datos: pd.DataFrame
) -> ResultadoPrediccion:
    """
    ultimos_datos: DataFrame ya procesado (salida de construir_dataset)
    con el histórico reciente del producto, ordenado por fecha.
    """
    artefacto = _cargar_artefacto(solicitud.negocio_id, solicitud.producto_id)
    horizonte = int(solicitud.horizonte_dias.value)

    if artefacto["tipo"] == "fallback_suavizado":
        cantidad_estimada = artefacto["valor_promedio"] * horizonte
        confianza = "baja"
        metodo = "fallback_suavizado"

    else:  # random_forest
        modelo = artefacto["modelo"]
        predicciones_diarias = []
        datos_simulados = ultimos_datos.copy()

        # Predicción recursiva: predice día 1, lo usa como insumo para día 2, etc.
        for i in range(horizonte):
            fecha_futura = datos_simulados["fecha"].iloc[-1] + timedelta(days=1)
            X_futuro = _construir_features_futuros(fecha_futura, datos_simulados)
            pred_dia = max(0, modelo.predict(X_futuro)[0])  # no permitir negativos
            predicciones_diarias.append(pred_dia)

            nueva_fila = datos_simulados.iloc[-1].copy()
            nueva_fila["fecha"] = fecha_futura
            nueva_fila["cantidad_vendida"] = pred_dia
            datos_simulados = pd.concat(
                [datos_simulados, pd.DataFrame([nueva_fila])], ignore_index=True
            )

        cantidad_estimada = sum(predicciones_diarias)
        mae = artefacto.get("mae_promedio")
        confianza = (
            "alta"
            if mae is not None and mae < (cantidad_estimada / horizonte * 0.3)
            else "media"
        )
        metodo = "random_forest"

    return ResultadoPrediccion(
        producto_id=solicitud.producto_id,
        horizonte_dias=horizonte,
        cantidad_estimada=round(cantidad_estimada, 2),
        confianza=confianza,
        metodo_usado=metodo,
    )
