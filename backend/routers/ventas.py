from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Venta

router = APIRouter(prefix="/ventas", tags=["ventas"])


@router.get("/")
def listar_ventas(negocio_id: int, db: Session = Depends(get_db)):
    return db.query(Venta).filter(Venta.negocio_id == negocio_id).all()


@router.get("/{venta_id}")
def obtener_venta(venta_id: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.venta_id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.delete("/{venta_id}")
def eliminar_venta(venta_id: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.venta_id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    db.delete(venta)
    db.commit()
    return {"mensaje": "Venta eliminada"}
