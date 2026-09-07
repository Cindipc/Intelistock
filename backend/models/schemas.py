from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional


class ProductoCreate(BaseModel):
    negocio_id: int
    categoria_id: Optional[int] = None
    nombre: str
    precio_unitario: Decimal
    stock_actual: int = 0


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio_unitario: Optional[Decimal] = None
    stock_actual: Optional[int] = None


class ProductoOut(ProductoCreate):
    producto_id: int

    class Config:
        from_attributes = True


class NegocioOut(BaseModel):
    negocio_id: int
    nombre: str
    rfc: Optional[str] = None
    fecha_registro: Optional[datetime] = None
    estado: str

    class Config:
        from_attributes = True
