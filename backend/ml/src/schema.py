from pydantic import Basemodel, Field
from datetime import date
from enum import (
    Enum,
)  # evita que lleguen strings arbitrarios ("Entrada" con mayúscula, "45 días", etc.)


class TipoMovimiento(str, Enum):
    entrada = "entrada"
    salida = "salida"


class VentaHistorica(Basemodel):
    negocio_id: str
    producto_id: str
    fecha: date
    cantidad_vendida: int = Field(ge=0)  # ge = greater or equal to 0
    negocio_abierto: bool = True


class MovimientoStock(Basemodel):
    negocio_id: str
    productto_id: str
    fecha: date
    tipo: TipoMovimiento
    cantiad: int = Field(gt=0)  # gt = greater than


class DatosEntrenamiento(Basemodel):
    """Lo que recibe train.py: historico completo de un negocio"""

    negocio_id: str
    ventas: list[VentaHistorica]
    movmientos_stock: list[MovimientoStock]


class HorizontePrediccion(str, Enum):
    quince_dias = "15"
    treinta_dias = "30"


class SolicitudPrediccion(Basemodel):
    """Lo que recibe predict.py"""

    negocio_id: str
    producto_id: str
    horizonte_prediccion: HorizontePrediccion


class ResultadoPrediccion(Basemodel):
    """Lo que devuelve predict.py"""

    producto_id: str
    horizonte_dias: int
    cantidad_estimada: float
    confianza: str  # "alta", "media", "baja"
    metodo_usado: str  # "random_forest" o "fallback_suavizado"
