from pydantic import BaseModel
from decimal import Decimal
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


class PrediccionRequest(BaseModel):
    negocio_id: int
    producto_id: int
    dias: int = 7


class PrediccionResponse(BaseModel):
    producto_id: int
    horizonte_dias: int
    cantidad_estimada: float
    confianza: str
    metodo_usado: str
