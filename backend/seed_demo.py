"""Siembra datos demo en PostgreSQL para que la prediccion funcione sin datos reales.

Crea:
- El negocio 1
- Los 4 productos demo (mismos que usa el frontend: backendId 1..4)
- 90 dias de ventas historicas por producto
- Corre el entrenamiento del modelo ML

Uso: python seed_demo.py
"""
import random
from datetime import date, timedelta

from database import SessionLocal
from models.db_models import Negocio, Producto, Venta, VentaDetalle
from service.pipeline_service import entrenar_modelo

NEGOCIO_ID = 1
DIAS_HISTORIAL = 90

DEMO_PRODUCTS = [
    {
        "nombre": "Cafe molido 250 g",
        "precio_unitario": 8.5,
        "stock_actual": 18,
        "venta_diaria_promedio": 5.0,
        "variabilidad": 2.0,
    },
    {
        "nombre": "Botella termica 750 ml",
        "precio_unitario": 14.0,
        "stock_actual": 64,
        "venta_diaria_promedio": 3.5,
        "variabilidad": 1.5,
    },
    {
        "nombre": "Kit cuidado facial",
        "precio_unitario": 22.0,
        "stock_actual": 142,
        "venta_diaria_promedio": 2.7,
        "variabilidad": 1.2,
    },
    {
        "nombre": "Libreta premium A5",
        "precio_unitario": 6.8,
        "stock_actual": 88,
        "venta_diaria_promedio": 2.1,
        "variabilidad": 1.0,
    },
]


def _cantidad_del_dia(promedio: float, variabilidad: float, fecha: date) -> int:
    factor_semana = 1.25 if fecha.weekday() in (4, 5) else 1.0
    cantidad = max(0, int(random.gauss(promedio, variabilidad) * factor_semana))
    return cantidad


def _entrenar(db) -> None:
    print("Entrenando modelos ML...")
    resultado = entrenar_modelo(NEGOCIO_ID, db)
    for producto_id, info in resultado["productos"].items():
        print(
            f"  -> producto {producto_id}: {info['n_registros']} ventas, "
            f"metodo={info['metodo']}, confianza={info['confianza']}"
        )


def seed() -> None:
    db = SessionLocal()
    try:
        negocio = db.query(Negocio).filter(Negocio.negocio_id == NEGOCIO_ID).first()
        if negocio is None:
            db.add(Negocio(negocio_id=NEGOCIO_ID, nombre="Negocio Demo"))
            db.flush()
            print(f"Negocio {NEGOCIO_ID} creado.")
        else:
            print(f"Negocio {NEGOCIO_ID} ya existia.")

        ya_hay_ventas = (
            db.query(Venta).filter(Venta.negocio_id == NEGOCIO_ID).count()
        )
        if ya_hay_ventas > 0:
            print(
                f"Ya hay {ya_hay_ventas} ventas registradas; no se vuelve a sembrar."
            )
            db.rollback()
            _entrenar(db)
            return

        productos = []
        for idx, datos in enumerate(DEMO_PRODUCTS, start=1):
            producto = (
                db.query(Producto)
                .filter(
                    Producto.negocio_id == NEGOCIO_ID,
                    Producto.nombre == datos["nombre"],
                )
                .first()
            )
            if producto is None:
                producto = Producto(
                    negocio_id=NEGOCIO_ID,
                    categoria_id=None,
                    nombre=datos["nombre"],
                    precio_unitario=datos["precio_unitario"],
                    stock_actual=datos["stock_actual"],
                )
                db.add(producto)
                db.flush()
                print(f"Producto {producto.producto_id} '{producto.nombre}' creado.")
            else:
                print(f"Producto {producto.producto_id} '{producto.nombre}' ya existia.")
            productos.append((producto, datos))

        hoy = date.today()
        total_detalles = 0
        for dia_atras in range(DIAS_HISTORIAL, 0, -1):
            fecha = hoy - timedelta(days=dia_atras)
            for producto, datos in productos:
                cantidad = _cantidad_del_dia(
                    datos["venta_diaria_promedio"], datos["variabilidad"], fecha
                )
                if cantidad == 0:
                    continue
                venta = Venta(
                    negocio_id=NEGOCIO_ID,
                    fecha_hora=fecha,
                    total=cantidad * datos["precio_unitario"],
                )
                db.add(venta)
                db.flush()
                db.add(
                    VentaDetalle(
                        venta_id=venta.venta_id,
                        producto_id=producto.producto_id,
                        cantidad=cantidad,
                        precio_unitario_venta=datos["precio_unitario"],
                    )
                )
                total_detalles += 1

        db.commit()
        print(f"Se insertaron {total_detalles} detalles de venta en ~{DIAS_HISTORIAL} dias.")

        _entrenar(db)
        print("Listo.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()