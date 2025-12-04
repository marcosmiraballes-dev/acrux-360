from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.auth import get_current_user
from app.database import get_supabase
import uuid

router = APIRouter(prefix="/puntos", tags=["puntos"])

# Schemas
class PuntoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    latitud: float
    longitud: float
    servicio_id: int
    radio_validacion: int = 50  # metros
    activo: bool = True

class PuntoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    servicio_id: Optional[int] = None
    radio_validacion: Optional[int] = None
    activo: Optional[bool] = None

class PuntoResponse(BaseModel):
    id: int
    codigo_qr: str
    nombre: str
    descripcion: Optional[str]
    latitud: float
    longitud: float
    servicio_id: int
    radio_validacion: int
    activo: bool
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime]

class PuntoConServicio(BaseModel):
    id: int
    codigo_qr: str
    nombre: str
    descripcion: Optional[str]
    latitud: float
    longitud: float
    servicio_id: int
    radio_validacion: int
    activo: bool
    servicio_nombre: Optional[str]
    fecha_creacion: datetime

# Dependency para admin
def require_admin(current_user = Depends(get_current_user)):
    if current_user.rol not in ["admin", "administrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden realizar esta acción"
        )
    return current_user

# GET - Listar puntos QR
@router.get("/", response_model=List[PuntoConServicio])
async def listar_puntos(
    activo: Optional[bool] = None,
    servicio_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    
    # Query con join a servicios
    query = supabase.table("puntos_control").select(
        "*, servicios(nombre)"
    )
    
    if activo is not None:
        query = query.eq("activo", activo)
    if servicio_id:
        query = query.eq("servicio_id", servicio_id)
    
    result = query.order("nombre").execute()
    
    # Formatear respuesta
    puntos = []
    for punto in result.data:
        servicio_nombre = None
        if punto.get("servicios"):
            servicio_nombre = punto["servicios"].get("nombre")
        
        puntos.append({
            **punto,
            "servicio_nombre": servicio_nombre
        })
    
    return puntos

# GET - Obtener punto por ID
@router.get("/{punto_id}", response_model=PuntoResponse)
async def obtener_punto(
    punto_id: int,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    result = supabase.table("puntos_control").select("*").eq("id", punto_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    return result.data[0]

# POST - Crear punto QR
@router.post("/", response_model=PuntoResponse, status_code=status.HTTP_201_CREATED)
async def crear_punto(
    punto: PuntoCreate,
    current_user: dict = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que el servicio existe
    servicio = supabase.table("servicios").select("id").eq("id", punto.servicio_id).execute()
    if not servicio.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    # Validar coordenadas
    if not (-90 <= punto.latitud <= 90):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitud debe estar entre -90 y 90"
        )
    if not (-180 <= punto.longitud <= 180):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Longitud debe estar entre -180 y 180"
        )
    
    # Validar radio
    if punto.radio_validacion < 10 or punto.radio_validacion > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Radio de validación debe estar entre 10 y 500 metros"
        )
    
    # Generar código QR único
    codigo_qr = f"ACRUX-{uuid.uuid4().hex[:12].upper()}"
    
    # Verificar que el código no existe (muy improbable pero por seguridad)
    existing = supabase.table("puntos_control").select("id").eq("codigo_qr", codigo_qr).execute()
    while existing.data:
        codigo_qr = f"ACRUX-{uuid.uuid4().hex[:12].upper()}"
        existing = supabase.table("puntos_control").select("id").eq("codigo_qr", codigo_qr).execute()
    
    nuevo_punto = {
        "codigo_qr": codigo_qr,
        "nombre": punto.nombre,
        "descripcion": punto.descripcion,
        "latitud": punto.latitud,
        "longitud": punto.longitud,
        "servicio_id": punto.servicio_id,
        "radio_validacion": punto.radio_validacion,
        "activo": punto.activo,
        "fecha_creacion": datetime.utcnow().isoformat()
    }
    
    result = supabase.table("puntos_control").insert(nuevo_punto).execute()
    return result.data[0]

# PUT - Actualizar punto QR
@router.put("/{punto_id}", response_model=PuntoResponse)
async def actualizar_punto(
    punto_id: int,
    punto_update: PuntoUpdate,
    current_user: dict = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que existe
    existing = supabase.table("puntos_control").select("*").eq("id", punto_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    update_data = {}
    
    if punto_update.nombre:
        update_data["nombre"] = punto_update.nombre
    
    if punto_update.descripcion is not None:
        update_data["descripcion"] = punto_update.descripcion
    
    if punto_update.latitud is not None:
        if not (-90 <= punto_update.latitud <= 90):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Latitud inválida"
            )
        update_data["latitud"] = punto_update.latitud
    
    if punto_update.longitud is not None:
        if not (-180 <= punto_update.longitud <= 180):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Longitud inválida"
            )
        update_data["longitud"] = punto_update.longitud
    
    if punto_update.servicio_id:
        # Verificar que el servicio existe
        servicio = supabase.table("servicios").select("id").eq("id", punto_update.servicio_id).execute()
        if not servicio.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Servicio no encontrado"
            )
        update_data["servicio_id"] = punto_update.servicio_id
    
    if punto_update.radio_validacion:
        if punto_update.radio_validacion < 10 or punto_update.radio_validacion > 500:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Radio inválido"
            )
        update_data["radio_validacion"] = punto_update.radio_validacion
    
    if punto_update.activo is not None:
        update_data["activo"] = punto_update.activo
    
    update_data["ultima_modificacion"] = datetime.utcnow().isoformat()
    
    result = supabase.table("puntos_control").update(update_data).eq("id", punto_id).execute()
    return result.data[0]

# DELETE - Eliminar punto QR
@router.delete("/{punto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_punto(
    punto_id: int,
    permanente: bool = False,
    current_user: dict = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que existe
    existing = supabase.table("puntos_control").select("id").eq("id", punto_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    # Verificar si tiene visitas asociadas
    visitas = supabase.table("visitas").select("id", count="exact").eq("punto_id", punto_id).execute()
    if visitas.count > 0 and permanente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar permanentemente. Hay {visitas.count} visitas asociadas"
        )
    
    if permanente:
        # Solo si no hay visitas
        supabase.table("puntos_control").delete().eq("id", punto_id).execute()
    else:
        # Soft delete
        supabase.table("puntos_control").update({
            "activo": False,
            "ultima_modificacion": datetime.utcnow().isoformat()
        }).eq("id", punto_id).execute()
    
    return None

# GET - Estadísticas de puntos
@router.get("/estadisticas/resumen")
async def estadisticas_puntos(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    
    total = supabase.table("puntos_control").select("id", count="exact").execute()
    activos = supabase.table("puntos_control").select("id", count="exact").eq("activo", True).execute()
    
    # Por servicio
    por_servicio = supabase.table("puntos_control").select(
        "servicio_id, servicios(nombre)",
        count="exact"
    ).eq("activo", True).execute()
    
    return {
        "total": total.count,
        "activos": activos.count,
        "inactivos": total.count - activos.count
    }

# GET - Obtener punto por código QR (mantener compatibilidad)
@router.get("/qr/{codigo_qr}")
async def obtener_punto_por_qr(
    codigo_qr: str,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    result = supabase.table("puntos_control").select("*").eq("codigo_qr", codigo_qr).eq("activo", True).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código QR no encontrado o inactivo"
        )
    
    return result.data[0]