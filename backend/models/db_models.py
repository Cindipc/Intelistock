from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP, ForeignKey, Date
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Negocio(Base):
    __tablename__ = "negocios"
    negocio_id = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)


class Categoria(Base):
    __tablename__ = "categorias"
    categoria_id = Column(Integer, primary_key=True)
    negocio_id = Column(Integer, ForeignKey("negocios.negocio_id"))
    nombre = Column(String(100), nullable=False)


class InventarioMovimiento(Base):
    __tablename__ = "inventario_movimientos"
    movimiento_id = Column(Integer, primary_key=True)
    negocio_id = Column(Integer, ForeignKey("negocios.negocio_id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.producto_id"), nullable=False)
    fecha = Column(Date, nullable=False)
    tipo = Column(String(20), nullable=False)
    cantidad = Column(Integer, nullable=False)


class Producto(Base):
    __tablename__ = "productos"
    producto_id = Column(Integer, primary_key=True)
    negocio_id = Column(Integer, ForeignKey("negocios.negocio_id"))
    categoria_id = Column(Integer, ForeignKey("categorias.categoria_id"))
    nombre = Column(String(150), nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    stock_actual = Column(Integer, nullable=False, default=0)


class Venta(Base):
    __tablename__ = "ventas"
    venta_id = Column(Integer, primary_key=True)
    negocio_id = Column(Integer, ForeignKey("negocios.negocio_id"))
    fecha_hora = Column(TIMESTAMP)
    total = Column(Numeric(12, 2))
    detalles = relationship("VentaDetalle", back_populates="venta")


class VentaDetalle(Base):
    __tablename__ = "venta_detalle"
    venta_detalle_id = Column(Integer, primary_key=True)
    venta_id = Column(Integer, ForeignKey("ventas.venta_id"))
    producto_id = Column(Integer, ForeignKey("productos.producto_id"))
    cantidad = Column(Integer, nullable=False)
    precio_unitario_venta = Column(Numeric(10, 2), nullable=False)
    venta = relationship("Venta", back_populates="detalles")
