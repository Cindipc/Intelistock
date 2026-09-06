import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import ml_router, crud_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("intellistock")

app = FastAPI(title="IntelliStock API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def manejador_global_de_errores(request: Request, exc: Exception):
    logger.exception("Error no manejado en %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Ocurrio un error interno inesperado."})


app.include_router(crud_router.router, prefix="/negocios", tags=["CRUD"])
app.include_router(ml_router.router, prefix="/negocios", tags=["ML"])


@app.get("/")
def root():
    return {"status": "ok", "servicio": "IntelliStock API"}
