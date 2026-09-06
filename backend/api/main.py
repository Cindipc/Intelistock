import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import ml_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intellistock")

app = FastAPI(title="IntelliStock API", version="0.1.0")


@app.exception_handler(Exception)
async def manejador_global_de_errores(request: Request, exc: Exception):
    """Red de seguridad: cualquier error no capturado en un endpoint
    cae aqui en vez de crashear el servidor o regresar un 500 sin formato."""
    logger.exception("Error no manejado en %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Ocurrio un error interno inesperado. El equipo ya fue notificado (revisa logs)."
        },
    )


# CORS: permite que el frontend (Vite, localhost:5173) llame a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ml_router.router, prefix="/negocios", tags=["ML"])


@app.get("/")
def root():
    return {"status": "ok", "servicio": "IntelliStock API"}
