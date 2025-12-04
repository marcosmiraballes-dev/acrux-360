from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, qr, visits, puntos  # <-- Agregar puntos

app = FastAPI(
    title="Sistema de Recorridas QR",
    description="API para control de rondas con QR y validación GPS",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(qr.router)
app.include_router(visits.router)
app.include_router(puntos.router)  # <-- Agregar esta línea

@app.get("/")
async def root():
    return {
        "message": "Sistema de Recorridas QR API",
        "version": "1.0.0",
        "status": "online"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}