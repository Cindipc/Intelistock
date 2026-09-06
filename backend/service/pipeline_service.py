import pandas as pd
import joblib
from sklearn.linear_model import SGDRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sqlalchemy.orm import Session
from models.db_models import Venta, VentaDetalle

MODEL_PATH = "models_ml/pipeline_v1.pkl"


def extraer_datos_entrenamiento(negocio_id: int, db: Session) -> pd.DataFrame:
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

    df = pd.read_sql(query.statement, db.bind)
    return df


def construir_features(df: pd.DataFrame) -> pd.DataFrame:
    df["dia_semana"] = pd.to_datetime(df["fecha_hora"]).dt.dayofweek
    df["dia_mes"] = pd.to_datetime(df["fecha_hora"]).dt.day
    df["mes"] = pd.to_datetime(df["fecha_hora"]).dt.month
    return df[["producto_id", "dia_semana", "dia_mes", "mes", "precio_unitario_venta"]]


def entrenar_modelo(negocio_id: int, db: Session) -> dict:
    df = extraer_datos_entrenamiento(negocio_id, db)

    if len(df) < 30:
        raise ValueError(
            "No hay suficientes datos históricos para entrenar (mínimo 30 registros)"
        )

    X = construir_features(df)
    y = df["cantidad"]

    pipeline = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("regresor", SGDRegressor(max_iter=1000, random_state=42)),
        ]
    )
    pipeline.fit(X, y)

    joblib.dump(pipeline, MODEL_PATH)
    return {"mensaje": "Modelo entrenado", "muestras_usadas": len(df)}


def cargar_modelo():
    return joblib.load(MODEL_PATH)
