from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, qr, visits, puntos, alertas
from app.routers import usuarios, servicios, qr_generator
from app.routers import puntos_qr_adapted as puntos_admin
from app.routers import reportes

app = FastAPI(title="Sistema de Recorridas QR - Acrux 360")

# CORS - SOLUCIÓN DEFINITIVA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # PERMITIR TODO TEMPORALMENTE
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers existentes
app.include_router(auth.router)
app.include_router(qr.router)
app.include_router(visits.router)
app.include_router(puntos.router)
app.include_router(alertas.router)
app.include_router(reportes.router)

# Routers nuevos del panel admin
app.include_router(usuarios.router)
app.include_router(servicios.router)
app.include_router(puntos_admin.router, prefix="/admin")
app.include_router(qr_generator.router)

@app.get("/")
async def root():
    return {
        "message": "API Sistema de Recorridas QR - Acrux 360",
        "version": "1.0",
        "status": "online"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}