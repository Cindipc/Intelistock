from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.db_models import Negocio, Producto, Venta, Categoria
from models.schemas import NegocioOut

router = APIRouter(prefix="/negocios", tags=["negocios"])


@router.get("/{negocio_id}", response_model=NegocioOut)
def obtener_negocio(negocio_id: int, db: Session = Depends(get_db)):
    negocio = db.query(Negocio).filter(Negocio.negocio_id == negocio_id).first()
    if not negocio:
        raise HTTPException(404, "Negocio no encontrado")
    return negocio


@router.get("/{negocio_id}/resumen")
def resumen_negocio(negocio_id: int, db: Session = Depends(get_db)):
    """Datos reales para la pantalla 'Mi Negocio' (reemplaza al mock de Empresas)."""
    negocio = db.query(Negocio).filter(Negocio.negocio_id == negocio_id).first()
    if not negocio:
        raise HTTPException(404, "Negocio no encontrado")

    total_productos = (
        db.query(func.count(Producto.producto_id))
        .filter(Producto.negocio_id == negocio_id)
        .scalar()
    )
    total_categorias = (
        db.query(func.count(func.distinct(Producto.categoria_id)))
        .filter(Producto.negocio_id == negocio_id)
        .scalar()
    )
    total_ventas = (
        db.query(func.count(Venta.venta_id))
        .filter(Venta.negocio_id == negocio_id)
        .scalar()
    )
    ingresos_totales = (
        db.query(func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.negocio_id == negocio_id)
        .scalar()
    )

    return {
        "negocio": {
            "negocio_id": negocio.negocio_id,
            "nombre": negocio.nombre,
            "rfc": negocio.rfc,
            "estado": negocio.estado,
        },
        "total_productos": total_productos or 0,
        "total_categorias": total_categorias or 0,
        "total_ventas": total_ventas or 0,
        "ingresos_totales": float(ingresos_totales or 0),
    }
