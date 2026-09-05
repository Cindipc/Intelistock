import sys
from pathlib import Path

# Sube desde ml/notebooks/ hasta backend/ para que los imports de "ml" funcionen
# Usamos __file__ (ubicacion real del script) y no cwd() (desde donde se ejecuta el comando)
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

import pandas as pd
import numpy as np
from datetime import date, timedelta

from ml.src.schema import (
    VentaHistorica,
    MovimientoStock,
    DatosEntrenamiento,
    SolicitudPrediccion,
    HorizontePrediccion,
)
from ml.src.train import entrenar_modelo
from ml.src.preprocessing import construir_dataset
from ml.src.predict import predecir
from ml.src.preprocessing import puede_entrenar

# --- 1. Generar datos sinteticos de un negocio con 2 productos ---
negocio_id = "negocio_test_1"
fecha_inicio = date(2026, 5, 1)
n_dias = 90  # 3 meses

np.random.seed(42)
ventas = []
movimientos = []

for producto_id, venta_base in [("prod_A", 10), ("prod_B", 3)]:
    for i in range(n_dias):
        fecha = fecha_inicio + timedelta(days=i)
        abierto = fecha.weekday() != 6  # cerrado domingos

        cantidad = max(0, int(np.random.poisson(venta_base))) if abierto else 0

        ventas.append(
            VentaHistorica(
                negocio_id=negocio_id,
                producto_id=producto_id,
                fecha=fecha,
                cantidad_vendida=cantidad,
                negocio_abierto=abierto,
            )
        )

        # Reabastecimiento cada 15 dias
        if i % 15 == 0:
            movimientos.append(
                MovimientoStock(
                    negocio_id=negocio_id,
                    producto_id=producto_id,
                    fecha=fecha,
                    tipo="entrada",
                    cantidad=150,
                )
            )
        if cantidad > 0:
            movimientos.append(
                MovimientoStock(
                    negocio_id=negocio_id,
                    producto_id=producto_id,
                    fecha=fecha,
                    tipo="salida",
                    cantidad=cantidad,
                )
            )

# Producto con pocos datos: para probar el fallback (menos de 20 registros)
producto_id = "prod_C"
venta_base = 5
for i in range(10):  # solo 10 dias de historial
    fecha = fecha_inicio + timedelta(days=i)
    abierto = fecha.weekday() != 6
    cantidad = max(0, int(np.random.poisson(venta_base))) if abierto else 0

    ventas.append(
        VentaHistorica(
            negocio_id=negocio_id,
            producto_id=producto_id,
            fecha=fecha,
            cantidad_vendida=cantidad,
            negocio_abierto=abierto,
        )
    )
    if cantidad > 0:
        movimientos.append(
            MovimientoStock(
                negocio_id=negocio_id,
                producto_id=producto_id,
                fecha=fecha,
                tipo="salida",
                cantidad=cantidad,
            )
        )


# Producto sin ninguna venta registrada (existe en catalogo pero nunca se vendio)
producto_id = "prod_D"
for i in range(30):
    fecha = fecha_inicio + timedelta(days=i)
    abierto = fecha.weekday() != 6
    ventas.append(
        VentaHistorica(
            negocio_id=negocio_id,
            producto_id=producto_id,
            fecha=fecha,
            cantidad_vendida=0,
            negocio_abierto=abierto,
        )
    )


datos = DatosEntrenamiento(
    negocio_id=negocio_id,
    ventas=ventas,
    movimientos_stock=movimientos,
)

# --- 2. Entrenar ---
resumen = entrenar_modelo(datos)
print("=== Resumen de entrenamiento ===")
for producto_id, info in resumen.items():
    print(producto_id, info)

# --- 3. Predecir ---
df_procesado = construir_dataset(datos)

for producto_id in ["prod_A", "prod_B", "prod_C", "prod_D"]:
    ultimos_datos = df_procesado[
        df_procesado["producto_id"] == producto_id
    ].sort_values("fecha")

    solicitud = SolicitudPrediccion(
        negocio_id=negocio_id,
        producto_id=producto_id,
        horizonte_dias=HorizontePrediccion.quince_dias,
    )

    resultado = predecir(solicitud, ultimos_datos)
    print(f"\n=== Prediccion {producto_id} ===")
    print(resultado)

datos_pocos_dias = DatosEntrenamiento(
    negocio_id="negocio_test_2",
    ventas=[
        VentaHistorica(
            negocio_id="negocio_test_2",
            producto_id="prod_X",
            fecha=date(2026, 8, 1),
            cantidad_vendida=5,
            negocio_abierto=True,
        )
    ],
    movimientos_stock=[],
)

print("\n=== Prueba puede_entrenar (poco historial) ===")
print(puede_entrenar(datos_pocos_dias))

print("\n=== Prueba puede_entrenar (historial completo) ===")
print(puede_entrenar(datos))


from ml.src.evaluate import generar_reporte

print("\n=== Reporte de evaluacion ===")
reporte = generar_reporte(datos, resumen)
print(reporte.to_string(index=False))
