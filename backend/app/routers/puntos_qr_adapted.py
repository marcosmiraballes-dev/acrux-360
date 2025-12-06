from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.auth import get_current_user
from app.database import get_supabase
import secrets

router = APIRouter(prefix="/puntos", tags=["puntos"])

# Schemas adaptados a servicio_id INTEGER
class PuntoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    latitud: float
    longitud: float
    servicio_id: int  # INTEGER
    radio_validacion: int = 50
    activo: bool = True

class PuntoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    servicio_id: Optional[int] = None  # INTEGER
    radio_validacion: Optional[int] = None
    activo: Optional[bool] = None

class PuntoResponse(BaseModel):
    id: int  # INTEGER
    qr_code: str
    nombre: str
    descripcion: Optional[str]
    latitud: float
    longitud: float
    servicio_id: int  # INTEGER
    radio_validacion: int
    activo: bool
    created_at: datetime
    updated_at: Optional[datetime]

class PuntoConServicio(BaseModel):
    id: int  # INTEGER
    qr_code: str
    codigo_qr: str  # Alias
    nombre: str
    descripcion: Optional[str]
    latitud: float
    longitud: float
    servicio_id: int  # INTEGER
    servicio_nombre: Optional[str]
    radio_validacion: int
    activo: bool
    created_at: datetime

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
    servicio_id: Optional[int] = None,  # INTEGER
    current_user = Depends(get_current_user)
):
    supabase = get_supabase()
    
    # Query SIN join
    query = supabase.table("puntos_qr").select("*")
    
    if activo is not None:
        query = query.eq("activo", activo)
    if servicio_id:
        query = query.eq("servicio_id", servicio_id)
    
    result = query.order("nombre").execute()
    
    # Obtener nombres de servicios por separado
    puntos = []
    for punto in result.data:
        servicio_nombre = None
        if punto.get("servicio_id"):
            try:
                servicio_result = supabase.table("servicios").select("nombre").eq("id", punto["servicio_id"]).execute()
                if servicio_result.data:
                    servicio_nombre = servicio_result.data[0]["nombre"]
            except:
                pass
        
        puntos.append({
            **punto,
            "codigo_qr": punto.get("qr_code", ""),  # Agregar alias
            "servicio_nombre": servicio_nombre
        })
    
    return puntos

# GET - Obtener punto por ID
@router.get("/{punto_id}", response_model=PuntoResponse)
async def obtener_punto(
    punto_id: int,  # INTEGER
    current_user = Depends(get_current_user)
):
    supabase = get_supabase()
    result = supabase.table("puntos_qr").select("*").eq("id", punto_id).execute()
    
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
    current_user = Depends(require_admin)
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
    qr_code = f"ACRUX-{secrets.token_hex(6).upper()}"
    
    # Verificar que el código no existe
    existing = supabase.table("puntos_qr").select("id").eq("qr_code", qr_code).execute()
    while existing.data:
        qr_code = f"ACRUX-{secrets.token_hex(6).upper()}"
        existing = supabase.table("puntos_qr").select("id").eq("qr_code", qr_code).execute()
    
    # Crear punto (sin id, será auto-generado por SERIAL)
    nuevo_punto = {
        "qr_code": qr_code,
        "nombre": punto.nombre,
        "descripcion": punto.descripcion,
        "latitud": float(punto.latitud),
        "longitud": float(punto.longitud),
        "servicio_id": punto.servicio_id,  # INTEGER
        "radio_validacion": punto.radio_validacion,
        "activo": punto.activo,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = supabase.table("puntos_qr").insert(nuevo_punto).execute()
    return result.data[0]

# PUT - Actualizar punto QR
@router.put("/{punto_id}", response_model=PuntoResponse)
async def actualizar_punto(
    punto_id: int,  # INTEGER
    punto_update: PuntoUpdate,
    current_user = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que existe
    existing = supabase.table("puntos_qr").select("*").eq("id", punto_id).execute()
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
        update_data["latitud"] = float(punto_update.latitud)
    
    if punto_update.longitud is not None:
        if not (-180 <= punto_update.longitud <= 180):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Longitud inválida"
            )
        update_data["longitud"] = float(punto_update.longitud)
    
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
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("puntos_qr").update(update_data).eq("id", punto_id).execute()
    return result.data[0]

# DELETE - Eliminar punto QR
@router.delete("/{punto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_punto(
    punto_id: int,  # INTEGER
    permanente: bool = False,
    current_user = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que existe
    existing = supabase.table("puntos_qr").select("id").eq("id", punto_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    # Verificar si tiene visitas asociadas
    visitas = supabase.table("visitas").select("id", count="exact").eq("punto_qr_id", punto_id).execute()
    if visitas.count and visitas.count > 0 and permanente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar permanentemente. Hay {visitas.count} visitas asociadas"
        )
    
    if permanente:
        # Solo si no hay visitas
        supabase.table("puntos_qr").delete().eq("id", punto_id).execute()
    else:
        # Soft delete
        supabase.table("puntos_qr").update({
            "activo": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", punto_id).execute()
    
    return None

# GET - Estadísticas de puntos
@router.get("/estadisticas/resumen")
async def estadisticas_puntos(current_user = Depends(get_current_user)):
    supabase = get_supabase()
    
    total = supabase.table("puntos_qr").select("id", count="exact").execute()
    activos = supabase.table("puntos_qr").select("id", count="exact").eq("activo", True).execute()
    
    return {
        "total": total.count or 0,
        "activos": activos.count or 0,
        "inactivos": (total.count or 0) - (activos.count or 0)
    }

# GET - Obtener punto por código QR (mantener compatibilidad)
@router.get("/qr/{qr_code}")
async def obtener_punto_por_qr(
    qr_code: str,
    current_user = Depends(get_current_user)
):
    supabase = get_supabase()
    result = supabase.table("puntos_qr").select("*").eq("qr_code", qr_code).eq("activo", True).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código QR no encontrado o inactivo"
        )
    
    return result.data[0]