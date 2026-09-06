# Revision Completa del Proyecto Intelistock

**Fecha:** 5 de septiembre de 2026  
**Objetivo:** Verificar que todo funcione correctamente: backend, frontend, ML e integracion entre componentes.

---

## 1. Dependencias Instaladas

- Se instalaron las dependencias del backend desde `requirements.txt`:
  - fastapi, uvicorn, joblib, numpy, pandas, pydantic, scikit-learn
- Frontend ya tenia todas sus dependencias en `node_modules/`

## 2. Backend - Todos los Endpoints Testeados

### Endpoints CRUD (`/negocios/{id}/...`)

| Metodo | Ruta | Estado | Descripcion |
|--------|------|--------|-------------|
| GET | `/negocios/{id}/productos` | OK | Lista productos de un negocio |
| POST | `/negocios/{id}/productos` | OK | Crea un producto nuevo |
| PUT | `/negocios/{id}/productos/{pid}` | OK | Edita un producto existente |
| DELETE | `/negocios/{id}/productos/{pid}` | OK | Elimina un producto |
| POST | `/negocios/{id}/ventas` | OK | Registra una venta individual |
| POST | `/negocios/{id}/ventas/lote` | OK | Registra ventas en lote |
| GET | `/negocios/{id}/ventas` | OK | Lista ventas de un negocio |
| POST | `/negocios/{id}/movimientos` | OK | Registra un movimiento de stock |
| GET | `/negocios/{id}/movimientos` | OK | Lista movimientos de un negocio |
| POST | `/negocios/{id}/entrenar-con-datos-guardados` | OK | Entrena modelos ML con datos en memoria |
| GET | `/negocios/{id}/historico/estado` | OK | Verifica si hay suficiente historial |

### Endpoints ML (`/negocios/{id}/...`)

| Metodo | Ruta | Estado | Descripcion |
|--------|------|--------|-------------|
| POST | `/negocios/{id}/predicciones` | OK | Genera prediccion para un producto |
| GET | `/negocios/{id}/recomendaciones-compra` | OK | Recomendaciones de compra para todos los productos |

### Manejo de errores verificado

- Producto duplicado: `400 - Ya existe un producto con SKU`
- Producto no encontrado: `404 - Producto no encontrado`
- negocio_id inconsistente (venta/movimiento): `400 - negocio_id no coincide`
- Prediccion sin historial: `404 - No hay historico para el producto`
- Entrenar sin datos: `422 - No hay ventas registradas`
- Entrenar con historial insuficiente: `422 - Se requieren al menos 30 dias`
- Horizonte invalido: `400 - horizonte_dias debe ser '15' o '30'`
- Error interno: handler global captura excepciones no manejadas

## 3. Frontend - Build y Lint

- `npm run build`: **Pasa** - 31 modulos transformados, sin errores
- `npm run lint`: **Pasa** - 0 errores, 0 warnings

### Correcciones aplicadas

1. **`preprocessing.py`** - `stock_agotado` ahora es `int` en vez de `boolean` para consistencia entre entrenamiento y prediccion
2. **`PredictionsPage.jsx`** - Se agrego `onOpenModal` como prop y se usa para mostrar modales de error

## 4. Integracion Frontend-Backend

Los 13 endpoints del frontend (`api.js`) estan perfectamente alineados con las rutas del backend:

| Frontend (api.js) | Backend (routers) |
|---|---|
| `listarProductos` | `GET /negocios/{id}/productos` |
| `crearProducto` | `POST /negocios/{id}/productos` |
| `editarProducto` | `PUT /negocios/{id}/productos/{pid}` |
| `eliminarProducto` | `DELETE /negocios/{id}/productos/{pid}` |
| `registrarVenta` | `POST /negocios/{id}/ventas` |
| `registrarVentasLote` | `POST /negocios/{id}/ventas/lote` |
| `listarVentas` | `GET /negocios/{id}/ventas` |
| `registrarMovimiento` | `POST /negocios/{id}/movimientos` |
| `listarMovimientos` | `GET /negocios/{id}/movimientos` |
| `estadoHistorico` | `GET /negocios/{id}/historico/estado` |
| `entrenarConDatosGuardados` | `POST /negocios/{id}/entrenar-con-datos-guardados` |
| `obtenerPrediccion` | `POST /negocios/{id}/predicciones` |
| `obtenerRecomendacionesCompra` | `GET /negocios/{id}/recomendaciones-compra` |

- CORS configurado para `http://localhost:5173` (frontend Vite)
- Frontend usa `VITE_API_URL=http://localhost:8000` via `.env`
- Timeout de 15 segundos en requests del frontend
- Manejo de errores con mensajes descriptivos en español

## 5. Modelo ML

- **Algoritmo**: RandomForestRegressor (para productos con >= 20 registros) o fallback suavizado exponencial
- **Features**: dia_semana, dia_mes, mes, es_fin_semana, venta_lag_1/7/14, media_movil_7, stock, stock_agotado
- **Entrenamiento**: TimeSeriesSplit con 3 folds (respeta orden temporal)
- **Prediccion**: Recursiva (predice dia 1, lo usa como insumo para dia 2, etc.)
- **Modelos persistidos**: Archivos `.joblib` en `backend/ml/models/`
- **Validacion**: Minimo 30 dias de historial para entrenar, recomendado 90+

## 6. Como Ejecutar

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

El frontend estara en `http://localhost:5173` y el backend en `http://localhost:8000`.

## 7. Estado Final

| Componente | Estado |
|------------|--------|
| Backend (API) | Funcional |
| Frontend (React) | Funcional |
| ML (predicciones) | Funcional |
| Integracion BE-FE | Funcional |
| Build | Pasa |
| Lint | Pasa |
| Manejo de errores | Completo |
