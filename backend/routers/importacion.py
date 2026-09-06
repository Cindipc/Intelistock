from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from service.etl_service import (
    validar_columnas,
    limpiar_dataframe,
    insertar_ventas_desde_df,
)
import pandas as pd
import io

router = APIRouter(prefix="/importacion", tags=["importacion"])


@router.post("/ventas")
async def importar_ventas(
    negocio_id: int, archivo: UploadFile = File(...), db: Session = Depends(get_db)
):
    if not archivo.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(400, "Solo se aceptan archivos .csv o .xlsx")

    contenido = await archivo.read()

    try:
        if archivo.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contenido))
        else:
            df = pd.read_excel(io.BytesIO(contenido))

        validar_columnas(df)
        df_limpio = limpiar_dataframe(df)
        resultado = insertar_ventas_desde_df(df_limpio, negocio_id, db)

    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error procesando archivo: {str(e)}")

    return {
        "mensaje": "Importación completada",
        "filas_procesadas": len(df_limpio),
        **resultado,
    }
