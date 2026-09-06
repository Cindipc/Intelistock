from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from service.pipeline_service import entrenar_modelo, cargar_modelo, construir_features
from models.schemas import PrediccionRequest, PrediccionResponse
import pandas as pd

router = APIRouter(prefix="/ml", tags=["machine-learning"])


@router.post("/entrenar")
def reentrenar(negocio_id: int, db: Session = Depends(get_db)):
    try:
        return entrenar_modelo(negocio_id, db)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/predecir", response_model=PrediccionResponse)
def predecir(request: PrediccionRequest, db: Session = Depends(get_db)):
    try:
        modelo = cargar_modelo()
    except FileNotFoundError:
        raise HTTPException(
            400, "No hay modelo entrenado todavía. Ejecuta /ml/entrenar primero."
        )

    fechas_futuras = pd.date_range(start=pd.Timestamp.now(), periods=request.dias)
    df_futuro = pd.DataFrame(
        {
            "producto_id": request.producto_id,
            "fecha_hora": fechas_futuras,
            "precio_unitario_venta": 0,
        }
    )

    X = construir_features(df_futuro)
    predicciones = modelo.predict(X)

    return PrediccionResponse(
        producto_id=request.producto_id,
        predicciones=predicciones.tolist(),
        fechas=[f.strftime("%Y-%m-%d") for f in fechas_futuras],
    )
