from fastapi import APIRouter, HTTPException, status, Depends
from app.models import UserResponse
from app.database import get_supabase_client
from app.auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/puntos", tags=["Puntos QR"])

class PuntoQRResponse(BaseModel):
    id: int  # CORREGIDO: int
    servicio_id: int  # CORREGIDO: int
    nombre: str
    descripcion: str | None
    latitud: float
    longitud: float
    qr_code: str
    activo: bool

@router.get("/", response_model=List[PuntoQRResponse])
async def get_puntos(
    servicio_id: Optional[int] = None,  # CORREGIDO: int
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Obtiene listado de puntos QR.
    - Guardia/Supervisor: solo puntos de su servicio
    - Administrador: puede filtrar por servicio_id o ver todos
    """
    supabase = get_supabase_client()
    
    query = supabase.table("puntos_qr").select("*")
    
    # Aplicar filtros según rol
    if current_user.rol in ["guardia", "supervisor"]:
        if not current_user.servicio_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario sin servicio asignado"
            )
        query = query.eq("servicio_id", current_user.servicio_id)
    elif current_user.rol in ["administrador", "admin"] and servicio_id:
        query = query.eq("servicio_id", servicio_id)
    
    # Solo puntos activos
    query = query.eq("activo", True)
    
    response = query.execute()
    
    puntos = []
    for punto_data in response.data:
        puntos.append(PuntoQRResponse(
            id=punto_data["id"],
            servicio_id=punto_data["servicio_id"],
            nombre=punto_data["nombre"],
            descripcion=punto_data.get("descripcion"),
            latitud=float(punto_data["latitud"]),
            longitud=float(punto_data["longitud"]),
            qr_code=punto_data["qr_code"],
            activo=punto_data["activo"]
        ))
    
    return puntos

@router.get("/{punto_id}", response_model=PuntoQRResponse)
async def get_punto(
    punto_id: int,  # CORREGIDO: int
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Obtiene información de un punto QR específico.
    """
    supabase = get_supabase_client()
    
    response = supabase.table("puntos_qr").select("*").eq("id", punto_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    punto_data = response.data[0]
    
    # Verificar permisos
    if current_user.rol in ["guardia", "supervisor"]:
        if punto_data["servicio_id"] != current_user.servicio_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este punto"
            )
    
    return PuntoQRResponse(
        id=punto_data["id"],
        servicio_id=punto_data["servicio_id"],
        nombre=punto_data["nombre"],
        descripcion=punto_data.get("descripcion"),
        latitud=float(punto_data["latitud"]),
        longitud=float(punto_data["longitud"]),
        qr_code=punto_data["qr_code"],
        activo=punto_data["activo"]
    )