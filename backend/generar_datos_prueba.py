"""
Script para generar datos de prueba en intelistock_db, pensado para que el
modulo ml/ (Random Forest con lags de 1/7/14 dias) tenga suficiente historial.

Genera ventas TODOS los dias (no salteados) durante ~95 dias, con estacionalidad
de fin de semana, para que las features de lag y media movil tengan sentido.

Uso:
    cd backend
    source venv/bin/activate
    python generar_datos_prueba.py
"""

import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

NOMBRE_NEGOCIO = "Abarrotes Don Pulpo"
RFC_NEGOCIO = "DEMO010101ABC"
DIAS_HISTORICO = 95

PRODUCTOS_SEED = [
    ("Lacteos y huevo", "Huevo blanco (kg)", 45.00, 15),
    ("Bebidas", "Refresco de cola 600ml", 18.00, 20),
    ("Abarrotes", "Tortillas de maiz (kg)", 22.00, 25),
    ("Botanas", "Sabritas original 45g", 17.50, 18),
]


def obtener_o_crear_negocio(conn):
    row = conn.execute(
        text("SELECT negocio_id FROM negocios WHERE rfc = :rfc"), {"rfc": RFC_NEGOCIO}
    ).fetchone()
    if row:
        conn.execute(
            text("UPDATE negocios SET nombre = :nombre WHERE negocio_id = :nid"),
            {"nombre": NOMBRE_NEGOCIO, "nid": row[0]},
        )
        return row[0]
    row = conn.execute(
        text(
            "INSERT INTO negocios (nombre, rfc, estado) VALUES (:nombre, :rfc, 'activo') RETURNING negocio_id"
        ),
        {"nombre": NOMBRE_NEGOCIO, "rfc": RFC_NEGOCIO},
    ).fetchone()
    return row[0]


def obtener_o_crear_categoria(conn, nombre):
    row = conn.execute(
        text("SELECT categoria_id FROM categorias WHERE nombre = :nombre"),
        {"nombre": nombre},
    ).fetchone()
    if row:
        conn.execute(
            text("UPDATE categorias SET nombre = :nombre WHERE categoria_id = :cid"),
            {"nombre": nombre, "cid": row[0]},
        )
        return row[0]
    row = conn.execute(
        text("INSERT INTO categorias (nombre) VALUES (:nombre) RETURNING categoria_id"),
        {"nombre": nombre},
    ).fetchone()
    return row[0]


def obtener_o_crear_producto(conn, negocio_id, categoria_id, nombre, precio):
    row = conn.execute(
        text(
            "SELECT producto_id FROM productos "
            "WHERE nombre = :nombre AND negocio_id = :negocio_id"
        ),
        {"nombre": nombre, "negocio_id": negocio_id},
    ).fetchone()
    if row:
        producto_id = row[0]
        conn.execute(
            text("""UPDATE productos
                   SET categoria_id = :categoria_id, nombre = :nombre,
                       precio_unitario = :precio, stock_actual = 500
                   WHERE producto_id = :producto_id"""),
            {
                "categoria_id": categoria_id,
                "nombre": nombre,
                "precio": precio,
                "producto_id": producto_id,
            },
        )
        return producto_id
    row = conn.execute(
        text(
            """INSERT INTO productos (negocio_id, categoria_id, nombre, precio_unitario, stock_actual)
                VALUES (:negocio_id, :categoria_id, :nombre, :precio, 500) RETURNING producto_id"""
        ),
        {
            "negocio_id": negocio_id,
            "categoria_id": categoria_id,
            "nombre": nombre,
            "precio": precio,
        },
    ).fetchone()
    return row[0]


def limpiar_historico_previo(conn, negocio_id):
    """Evita duplicar historico si vuelves a correr el script sobre el mismo negocio.
    Tambien borra los productos viejos (ej. si cambiaste el catalogo de cafeteria a tienda),
    para que no queden huerfanos sin ventas asociadas."""
    conn.execute(
        text("""
        DELETE FROM venta_detalle WHERE venta_id IN (SELECT venta_id FROM ventas WHERE negocio_id = :nid)
    """),
        {"nid": negocio_id},
    )
    conn.execute(
        text(
            "DELETE FROM inventario_movimientos WHERE producto_id IN (SELECT producto_id FROM productos WHERE negocio_id = :nid)"
        ),
        {"nid": negocio_id},
    )
    conn.execute(
        text("DELETE FROM ventas WHERE negocio_id = :nid"), {"nid": negocio_id}
    )
    conn.execute(
        text("DELETE FROM productos WHERE negocio_id = :nid"), {"nid": negocio_id}
    )


def generar_historico_diario(conn, negocio_id, productos):
    """
    productos: lista de (producto_id, precio, venta_base_diaria)
    Genera UNA venta por dia por producto (fila diaria, no salteada),
    con ruido tipo Poisson y un boost de fin de semana.
    Ademas genera un movimiento de 'entrada' (reabastecimiento) cada 15 dias.
    """
    hoy = datetime.now().date()
    inicio = hoy - timedelta(days=DIAS_HISTORICO)
    total_ventas = 0
    total_detalles = 0

    for producto_id, precio, venta_base in productos:
        for i in range(DIAS_HISTORICO):
            fecha = inicio + timedelta(days=i)
            es_fin_de_semana = fecha.weekday() >= 5
            base = venta_base * (1.6 if es_fin_de_semana else 1.0)
            cantidad = max(0, int(random.gauss(base, base * 0.25)))

            if cantidad == 0:
                continue

            hora_aleatoria = datetime.combine(fecha, datetime.min.time()) + timedelta(
                hours=random.randint(8, 20), minutes=random.randint(0, 59)
            )
            subtotal = cantidad * float(precio)

            venta_id = conn.execute(
                text(
                    "INSERT INTO ventas (negocio_id, fecha_hora, total) VALUES (:nid, :fecha, :total) RETURNING venta_id"
                ),
                {"nid": negocio_id, "fecha": hora_aleatoria, "total": subtotal},
            ).fetchone()[0]
            total_ventas += 1

            conn.execute(
                text(
                    """INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario_venta)
                        VALUES (:vid, :pid, :cantidad, :precio)"""
                ),
                {
                    "vid": venta_id,
                    "pid": producto_id,
                    "cantidad": cantidad,
                    "precio": precio,
                },
            )
            total_detalles += 1

            if i % 15 == 0:
                conn.execute(
                    text(
                        """INSERT INTO inventario_movimientos (producto_id, tipo_movimiento, cantidad, fecha_hora)
                            VALUES (:pid, 'entrada', :cantidad, :fecha)"""
                    ),
                    {"pid": producto_id, "cantidad": 200, "fecha": hora_aleatoria},
                )

    return total_ventas, total_detalles


def main():
    with engine.begin() as conn:
        negocio_id = obtener_o_crear_negocio(conn)
        print(f"Negocio listo (id={negocio_id})")

        limpiar_historico_previo(conn, negocio_id)
        print("Historico previo de este negocio limpiado (para evitar duplicados).")

        productos_creados = []
        for categoria_nombre, producto_nombre, precio, venta_base in PRODUCTOS_SEED:
            categoria_id = obtener_o_crear_categoria(conn, categoria_nombre)
            producto_id = obtener_o_crear_producto(
                conn, negocio_id, categoria_id, producto_nombre, precio
            )
            productos_creados.append((producto_id, precio, venta_base))
            print(f"Producto listo: {producto_nombre} (id={producto_id})")

        total_ventas, total_detalles = generar_historico_diario(
            conn, negocio_id, productos_creados
        )
        print(
            f"\nGeneradas {total_ventas} ventas con {total_detalles} renglones de detalle"
        )
        print(f"Rango de fechas: ultimos {DIAS_HISTORICO} dias (diario, sin huecos)")
        print(f"\nnegocio_id para usar en la API y el frontend: {negocio_id}")
        print(
            "Configura VITE_NEGOCIO_ID="
            f"{negocio_id} en frontend/.env si este no es el negocio activo (1)."
        )
        print("IDs de producto:", [p[0] for p in productos_creados])


if __name__ == "__main__":
    main()
