from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import Producto
from models.schemas import ProductoCreate, ProductoUpdate, ProductoOut

router = APIRouter(prefix="/productos", tags=["productos"])


@router.post("/", response_model=ProductoOut)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    nuevo = Producto(**producto.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[ProductoOut])
def listar_productos(negocio_id: int, db: Session = Depends(get_db)):
    return db.query(Producto).filter(Producto.negocio_id == negocio_id).all()


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.producto_id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.patch("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(
    producto_id: int, cambios: ProductoUpdate, db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(Producto.producto_id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for campo, valor in cambios.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.producto_id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
    return {"mensaje": "Producto eliminado"}
