from fastapi import FastAPI
from routers import productos, importacion, prediccion

app = FastAPI(title="IntelliStock API")

app.include_router(productos.router)
app.include_router(importacion.router)
app.include_router(prediccion.router)


@app.get("/")
def root():
    return {"status": "IntelliStock API funcionando"}
