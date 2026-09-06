from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from service.pipeline_service import entrenar_modelo, predecir_producto
from models.schemas import PrediccionRequest, PrediccionResponse

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
        resultado = predecir_producto(
            request.negocio_id, request.producto_id, request.dias, db
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    return resultado
