from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from database import get_db
from models.db_models import Producto
from models.schemas import ProductoCreate, ProductoUpdate, ProductoOut

router = APIRouter(prefix="/productos", tags=["productos"])


@router.post("/", response_model=ProductoOut)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    try:
        nuevo = Producto(**producto.model_dump())
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo
    except OperationalError:
        raise HTTPException(503, "Base de datos no disponible")
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))


@router.get("/", response_model=list[ProductoOut])
def listar_productos(negocio_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(Producto).filter(Producto.negocio_id == negocio_id).all()
    except OperationalError:
        raise HTTPException(503, "Base de datos no disponible")


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    try:
        producto = db.query(Producto).filter(Producto.producto_id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        return producto
    except OperationalError:
        raise HTTPException(503, "Base de datos no disponible")


@router.patch("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(
    producto_id: int, cambios: ProductoUpdate, db: Session = Depends(get_db)
):
    try:
        producto = db.query(Producto).filter(Producto.producto_id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        for campo, valor in cambios.model_dump(exclude_unset=True).items():
            setattr(producto, campo, valor)
        db.commit()
        db.refresh(producto)
        return producto
    except OperationalError:
        raise HTTPException(503, "Base de datos no disponible")


@router.delete("/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    try:
        producto = db.query(Producto).filter(Producto.producto_id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        db.delete(producto)
        db.commit()
        return {"mensaje": "Producto eliminado"}
    except OperationalError:
        raise HTTPException(503, "Base de datos no disponible")
