from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from service.pipeline_service import (
    validar_historico,
    entrenar_modelo,
    predecir_producto,
)
from ml.src.schema import ResultadoPrediccion

router = APIRouter(prefix="/ml", tags=["machine-learning"])


@router.get("/estado")
def estado_historico(negocio_id: int, db: Session = Depends(get_db)):
    """Revisa si el negocio ya tiene suficiente historial para entrenar."""
    return validar_historico(negocio_id, db)


@router.post("/entrenar")
def reentrenar(negocio_id: int, db: Session = Depends(get_db)):
    try:
        return entrenar_modelo(negocio_id, db)
    except ValueError as e:
        raise HTTPException(422, str(e))


@router.post("/predecir", response_model=ResultadoPrediccion)
def predecir(
    negocio_id: int,
    producto_id: int,
    horizonte_dias: str = "15",
    db: Session = Depends(get_db),
):
    if horizonte_dias not in ("15", "30"):
        raise HTTPException(400, "horizonte_dias solo acepta '15' o '30'")
    return predecir_producto(negocio_id, producto_id, horizonte_dias, db)
