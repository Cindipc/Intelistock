from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import importacion, negocios, prediccion, productos
from routers import ventas
from database import db_is_available
from sqlalchemy.exc import OperationalError

app = FastAPI(title="IntelliStock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(OperationalError)
async def db_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Base de datos no disponible. El backend funciona pero no puede acceder a PostgreSQL.",
            "db_status": "down",
        },
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


app.include_router(productos.router)
app.include_router(importacion.router)
app.include_router(prediccion.router)
app.include_router(ventas.router)
app.include_router(negocios.router)


@app.get("/")
def root():
    return {"status": "IntelliStock API funcionando"}


@app.get("/health")
def health():
    db_ok = db_is_available()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
    }
