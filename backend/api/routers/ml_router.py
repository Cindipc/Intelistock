import logging
from fastapi import APIRouter, HTTPException

from ml.src.schema import (
    DatosEntrenamiento,
    SolicitudPrediccion,
    ResultadoPrediccion,
    HorizontePrediccion,
)
from ml.src.preprocessing import puede_entrenar, construir_dataset
from ml.src.train import entrenar_modelo
from ml.src.predict import predecir

router = APIRouter()
logger = logging.getLogger("intellistock.ml")


@router.post("/{negocio_id}/historico/validar")
def validar_historico(negocio_id: str, datos: DatosEntrenamiento):
    if datos.negocio_id != negocio_id:
        raise HTTPException(400, "negocio_id del body no coincide con la URL")

    try:
        return puede_entrenar(datos)
    except Exception:
        logger.exception("Error validando historico para negocio %s", negocio_id)
        raise HTTPException(
            500,
            "No se pudo validar el historico. Revisa el formato de los datos enviados.",
        )


@router.post("/{negocio_id}/entrenar")
def entrenar(negocio_id: str, datos: DatosEntrenamiento):
    if datos.negocio_id != negocio_id:
        raise HTTPException(400, "negocio_id del body no coincide con la URL")

    try:
        validacion = puede_entrenar(datos)
    except Exception:
        logger.exception(
            "Error validando historico antes de entrenar, negocio %s", negocio_id
        )
        raise HTTPException(500, "No se pudo validar el historico antes de entrenar.")

    if not validacion["puede_entrenar"]:
        raise HTTPException(422, validacion["razon"])

    try:
        resumen = entrenar_modelo(datos)
    except Exception:
        logger.exception("Error entrenando modelos para negocio %s", negocio_id)
        raise HTTPException(
            500,
            "Ocurrio un error entrenando los modelos. Intenta de nuevo o revisa los datos.",
        )

    return {"validacion": validacion, "resumen_entrenamiento": resumen}


@router.post("/{negocio_id}/predicciones", response_model=ResultadoPrediccion)
def obtener_prediccion(
    negocio_id: str, solicitud: SolicitudPrediccion, datos: DatosEntrenamiento
):
    """
    NOTA: por ahora recibe 'datos' (el historico) directo en el body,
    porque la BD aun no esta lista. Cuando este lista, este endpoint
    debe leer el historico desde Postgres usando negocio_id.
    """
    if solicitud.negocio_id != negocio_id or datos.negocio_id != negocio_id:
        raise HTTPException(400, "negocio_id inconsistente entre URL y body")

    try:
        df_procesado = construir_dataset(datos)
    except Exception:
        logger.exception("Error procesando historico para negocio %s", negocio_id)
        raise HTTPException(
            500,
            "No se pudo procesar el historico enviado. Revisa el formato de fechas y cantidades.",
        )

    ultimos_datos = df_procesado[df_procesado["producto_id"] == solicitud.producto_id]
    if ultimos_datos.empty:
        raise HTTPException(
            404, f"No hay historico para el producto {solicitud.producto_id}"
        )

    try:
        return predecir(solicitud, ultimos_datos)
    except Exception:
        logger.exception(
            "Error prediciendo negocio=%s producto=%s",
            negocio_id,
            solicitud.producto_id,
        )
        raise HTTPException(
            500,
            "Ocurrio un error generando la prediccion. Verifica que el modelo exista.",
        )


@router.post("/{negocio_id}/recomendaciones-compra")
def recomendaciones_compra(
    negocio_id: str, datos: DatosEntrenamiento, horizonte_dias: str = "15"
):
    """Devuelve la prediccion consolidada de todos los productos del negocio."""
    if datos.negocio_id != negocio_id:
        raise HTTPException(400, "negocio_id del body no coincide con la URL")

    try:
        horizonte_valido = HorizontePrediccion(horizonte_dias)
    except ValueError:
        raise HTTPException(400, "horizonte_dias debe ser '15' o '30'")

    try:
        df_procesado = construir_dataset(datos)
    except Exception:
        logger.exception("Error procesando historico para negocio %s", negocio_id)
        raise HTTPException(500, "No se pudo procesar el historico enviado.")

    productos = df_procesado["producto_id"].unique()
    resultados = []
    productos_sin_modelo = []

    for producto_id in productos:
        ultimos_datos = df_procesado[df_procesado["producto_id"] == producto_id]
        solicitud = SolicitudPrediccion(
            negocio_id=negocio_id,
            producto_id=producto_id,
            horizonte_dias=horizonte_valido,
        )
        try:
            resultado = predecir(solicitud, ultimos_datos)
            resultados.append(resultado)
        except Exception:
            # Un producto sin modelo entrenado no debe tumbar toda la respuesta
            logger.warning(
                "No se pudo predecir producto=%s en negocio=%s", producto_id, negocio_id
            )
            productos_sin_modelo.append(producto_id)
            continue

    return {
        "negocio_id": negocio_id,
        "recomendaciones": resultados,
        "productos_sin_modelo": productos_sin_modelo,
    }
