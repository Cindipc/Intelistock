# Integración del módulo ML — IntelliStock

Este documento resume todo lo que necesitan quienes trabajan en BD, API/CRUD y frontend para integrar el módulo de Machine Learning ya construido y probado.

---

## 1. Variables de entorno (`.env`)

El módulo de ML en sí **no se conecta directo a Postgres ni al frontend** — solo recibe datos ya estructurados (vía Pydantic) y devuelve resultados. Quien sí necesita el `.env` es la capa de **API/CRUD**, para conectar Postgres y exponer los endpoints al frontend.

Archivo `backend/.env` (no se sube a git, agrégalo a `.gitignore` si no está):

```env
# --- Base de datos ---
DATABASE_URL=postgresql://usuario:password@localhost:5432/intelistock_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=intelistock_db
DB_USER=usuario
DB_PASSWORD=password

# --- API ---
API_HOST=0.0.0.0
API_PORT=8000
API_ENV=development          # development | production
CORS_ORIGINS=http://localhost:5173   # URL del frontend (Vite default)

# --- ML ---
ML_MODELS_DIR=./ml/models    # donde se guardan los .joblib
ML_MIN_DIAS_HISTORIAL=30
ML_DIAS_RECOMENDADOS=90
```

Nota: los valores reales de usuario/password/host de Postgres los define quien monta la BD — esto es solo la plantilla de qué variables debe haber.

El **frontend** típicamente solo necesita saber la URL base de la API:

```env
# frontend/.env
VITE_API_URL=http://localhost:8000
```

---

## 2. Rutas de API que se deben crear (para quien hace el CRUD/FastAPI)

Estas rutas son las que conectan el frontend con tu módulo ML. Los nombres son sugeridos, pueden ajustarse en equipo:

| Método | Ruta | Qué hace | Función ML que llama |
|---|---|---|---|
| `POST` | `/negocios/{negocio_id}/historico/validar` | Revisa si el negocio tiene suficiente historial antes de entrenar | `puede_entrenar(datos)` |
| `POST` | `/negocios/{negocio_id}/entrenar` | Entrena/reentrena los modelos de todos los productos del negocio | `entrenar_modelo(datos)` |
| `POST` | `/negocios/{negocio_id}/predicciones` | Devuelve la predicción de un producto a 15 o 30 días | `predecir(solicitud, ultimos_datos)` |
| `GET` | `/negocios/{negocio_id}/modelos/estado` | Lista qué productos tienen modelo, con qué confianza y método | Lee de la tabla `modelos_entrenados` (ver abajo) |
| `POST` | `/negocios/{negocio_id}/ventas/excel` | Recibe el Excel subido por el usuario y lo normaliza al esquema ML | No es ML — lo resuelve el CRUD, pero debe entregar datos en el formato de `VentaHistorica` |
| `POST` | `/negocios/{negocio_id}/reporte-evaluacion` | (Opcional) Genera el reporte de MAE vs baseline por producto | `generar_reporte(datos, resumen)` |

**Formato esperado en request/response:** usar directamente las clases de `backend/ml/src/schema.py` (`VentaHistorica`, `MovimientoStock`, `DatosEntrenamiento`, `SolicitudPrediccion`, `ResultadoPrediccion`) como los `Pydantic models` de FastAPI — ya están listas para eso, no hay que duplicarlas.

Ejemplo de cómo se vería el endpoint de predicción:

```python
from fastapi import APIRouter
from ml.src.schema import SolicitudPrediccion, ResultadoPrediccion
from ml.src.predict import predecir
from ml.src.preprocessing import construir_dataset

router = APIRouter()

@router.post("/negocios/{negocio_id}/predicciones", response_model=ResultadoPrediccion)
def obtener_prediccion(negocio_id: str, solicitud: SolicitudPrediccion):
    datos_historicos = obtener_datos_de_bd(negocio_id)  # lo resuelve BD/CRUD
    df_procesado = construir_dataset(datos_historicos)
    ultimos_datos = df_procesado[df_procesado["producto_id"] == solicitud.producto_id]
    return predecir(solicitud, ultimos_datos)
```

---

## 3. Lo que necesita la persona de BD (Postgres)

### 3.1 Tabla de ventas históricas
Mínimo necesario para que el ML funcione:

```sql
CREATE TABLE ventas_historicas (
    id SERIAL PRIMARY KEY,
    negocio_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    fecha DATE NOT NULL,
    cantidad_vendida INTEGER NOT NULL CHECK (cantidad_vendida >= 0),
    negocio_abierto BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (negocio_id, producto_id, fecha)
);
```

### 3.2 Tabla de movimientos de inventario (ya existía como `inventario_movimientos`)

```sql
CREATE TABLE inventario_movimientos (
    id SERIAL PRIMARY KEY,
    negocio_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0)
);
```

### 3.3 Tabla nueva: registro de modelos entrenados

```sql
CREATE TABLE modelos_entrenados (
    id SERIAL PRIMARY KEY,
    negocio_id UUID NOT NULL,
    producto_id UUID NOT NULL,
    metodo VARCHAR(30) NOT NULL,          -- 'random_forest' o 'fallback_suavizado'
    confianza VARCHAR(10) NOT NULL,       -- 'alta', 'media', 'baja', 'sin_datos'
    mae FLOAT,                            -- NULL si es fallback
    n_registros INTEGER NOT NULL,
    path_archivo TEXT NOT NULL,
    fecha_entrenamiento TIMESTAMP DEFAULT NOW(),
    UNIQUE (negocio_id, producto_id)
);
```

### 3.4 Reglas de negocio que la BD/API deben aplicar antes de llamar al ML
- Mínimo **30 días** de historial para poder entrenar (`ML_MIN_DIAS_HISTORIAL`).
- Recomendado **90 días** para mayor precisión (`ML_DIAS_RECOMENDADOS`) — si hay menos, se debe mostrar advertencia al usuario (el campo `advertencia` que devuelve `puede_entrenar()`).
- Los horizontes de predicción están fijos a **15 o 30 días** — no se debe permitir un valor arbitrario desde el frontend.

### 3.5 Pendiente de decidir en equipo
- Dónde viven físicamente los archivos `.joblib` en producción (disco del servidor vs almacenamiento externo tipo S3) — afecta el campo `path_archivo`.
- Cuándo se dispara el reentrenamiento automático (¿cada semana? ¿cada X ventas nuevas?) — no implementado todavía, es v2.

---

## 4. Resumen para quien hace el CRUD/API

- Las funciones que debes importar y usar están en `backend/ml/src/`:
  - `preprocessing.puede_entrenar(datos: DatosEntrenamiento) -> dict`
  - `train.entrenar_modelo(datos: DatosEntrenamiento) -> dict`
  - `preprocessing.construir_dataset(datos: DatosEntrenamiento) -> pd.DataFrame`
  - `predict.predecir(solicitud: SolicitudPrediccion, ultimos_datos: pd.DataFrame) -> ResultadoPrediccion`
  - `evaluate.generar_reporte(datos: DatosEntrenamiento, resumen_entrenamiento: dict) -> pd.DataFrame`
- Todos los modelos de datos (`VentaHistorica`, `MovimientoStock`, etc.) ya son clases Pydantic — se pueden usar directo como `response_model` o body de FastAPI sin reescribirlas.
- `predecir()` ya maneja el caso de que no exista modelo entrenado (devuelve `confianza="sin_datos"` en vez de tronar) — no hace falta un try/except adicional para ese caso específico.
- El módulo fue probado con: modelo confiable, modelo de confianza media, fallback por poco historial, producto sin ventas, e historial insuficiente para entrenar. Todos los casos están cubiertos en `backend/ml/notebooks/prueba_flujo.py` como referencia.
- Dependencias exactas en `backend/requirements.txt`.