import logging
from fastapi import APIRouter, HTTPException

from ml.src.schema import SolicitudPrediccion, ResultadoPrediccion, HorizontePrediccion
from ml.src.preprocessing import construir_dataset
from ml.src.predict import predecir
from api.routers.crud_router import _construir_datos_entrenamiento

router = APIRouter()
logger = logging.getLogger("intellistock.ml")


@router.post("/{negocio_id}/predicciones", response_model=ResultadoPrediccion)
def obtener_prediccion(negocio_id: str, solicitud: SolicitudPrediccion):
    if solicitud.negocio_id != negocio_id:
        raise HTTPException(400, "negocio_id inconsistente entre URL y body")
    try:
        datos = _construir_datos_entrenamiento(negocio_id)
        df_procesado = construir_dataset(datos)
    except Exception:
        logger.exception("Error procesando historico para negocio %s", negocio_id)
        raise HTTPException(500, "No se pudo procesar el historico. ¿Ya cargaste ventas para este negocio?")
    ultimos_datos = df_procesado[df_procesado["producto_id"] == solicitud.producto_id]
    if ultimos_datos.empty:
        raise HTTPException(404, f"No hay historico para el producto {solicitud.producto_id}")
    try:
        return predecir(solicitud, ultimos_datos)
    except Exception:
        logger.exception("Error prediciendo negocio=%s producto=%s", negocio_id, solicitud.producto_id)
        raise HTTPException(500, "Ocurrio un error generando la prediccion.")


@router.get("/{negocio_id}/recomendaciones-compra")
def recomendaciones_compra(negocio_id: str, horizonte_dias: str = "15"):
    try:
        horizonte_valido = HorizontePrediccion(horizonte_dias)
    except ValueError:
        raise HTTPException(400, "horizonte_dias debe ser '15' o '30'")
    try:
        datos = _construir_datos_entrenamiento(negocio_id)
        df_procesado = construir_dataset(datos)
    except Exception:
        logger.exception("Error procesando historico para negocio %s", negocio_id)
        raise HTTPException(500, "No se pudo procesar el historico. ¿Ya cargaste ventas para este negocio?")
    if df_procesado.empty:
        return {"negocio_id": negocio_id, "recomendaciones": [], "productos_sin_modelo": []}
    productos = df_procesado["producto_id"].unique()
    resultados = []
    productos_sin_modelo = []
    for producto_id in productos:
        ultimos_datos = df_procesado[df_procesado["producto_id"] == producto_id]
        solicitud = SolicitudPrediccion(negocio_id=negocio_id, producto_id=producto_id, horizonte_dias=horizonte_valido)
        try:
            resultados.append(predecir(solicitud, ultimos_datos))
        except Exception:
            logger.warning("Sin modelo para producto=%s en negocio=%s", producto_id, negocio_id)
            productos_sin_modelo.append(producto_id)
    return {"negocio_id": negocio_id, "recomendaciones": resultados, "productos_sin_modelo": productos_sin_modelo}
