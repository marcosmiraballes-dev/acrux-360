from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, time
from app.auth import get_current_user
from app.database import get_supabase

router = APIRouter(prefix="/servicios", tags=["servicios"])

# Schemas
class ServicioCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    hora_inicio: str  # formato "HH:MM"
    hora_fin: str     # formato "HH:MM"
    dias_activo: List[int]  # [0,1,2,3,4,5,6] donde 0=Lunes
    intervalo_ronda_minutos: int  # cada cuánto debe hacerse la ronda
    activo: bool = True

class ServicioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    dias_activo: Optional[List[int]] = None
    intervalo_ronda_minutos: Optional[int] = None
    activo: Optional[bool] = None

class ServicioResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    hora_inicio: str
    hora_fin: str
    dias_activo: List[int]
    intervalo_ronda_minutos: int
    activo: bool
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime]

# Dependency para admin/supervisor
def require_admin_or_supervisor(current_user = Depends(get_current_user)):
    if current_user.rol not in ["admin", "administrador", "supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores o supervisores pueden acceder"
        )
    return current_user

# Dependency solo para admin
def require_admin(current_user = Depends(get_current_user)):
    if current_user.rol not in ["admin", "administrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden realizar esta acción"
        )
    return current_user

# GET - Listar servicios
@router.get("/", response_model=List[ServicioResponse])
async def listar_servicios(
    activo: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    
    query = supabase.table("servicios").select("*")
    
    if activo is not None:
        query = query.eq("activo", activo)
    
    result = query.order("nombre").execute()
    return result.data

# GET - Obtener servicio por ID
@router.get("/{servicio_id}", response_model=ServicioResponse)
async def obtener_servicio(
    servicio_id: int,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    result = supabase.table("servicios").select("*").eq("id", servicio_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    return result.data[0]

# POST - Crear servicio
@router.post("/", response_model=ServicioResponse, status_code=status.HTTP_201_CREATED)
async def crear_servicio(
    servicio: ServicioCreate,
    current_user: dict = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Validar formato de horas
    try:
        hora_inicio_obj = time.fromisoformat(servicio.hora_inicio)
        hora_fin_obj = time.fromisoformat(servicio.hora_fin)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de hora inválido. Usar HH:MM"
        )
    
    # PERMITIR servicios nocturnos (hora_inicio > hora_fin)
    # Ejemplo: 22:00 a 06:00 es válido para servicios nocturnos
    # No validamos que hora_fin > hora_inicio
    
    # Validar días
    if not all(0 <= dia <= 6 for dia in servicio.dias_activo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Días inválidos. Deben estar entre 0 (Lunes) y 6 (Domingo)"
        )
    
    if len(servicio.dias_activo) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe seleccionar al menos un día activo"
        )
    
    # Validar intervalo
    if servicio.intervalo_ronda_minutos < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El intervalo mínimo es de 5 minutos"
        )
    
    # Verificar nombre único
    existing = supabase.table("servicios").select("id").eq("nombre", servicio.nombre).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un servicio con ese nombre"
        )
    
    nuevo_servicio = {
        "nombre": servicio.nombre,
        "descripcion": servicio.descripcion,
        "hora_inicio": servicio.hora_inicio,
        "hora_fin": servicio.hora_fin,
        "dias_activo": servicio.dias_activo,
        "intervalo_ronda_minutos": servicio.intervalo_ronda_minutos,
        "activo": servicio.activo,
        "fecha_creacion": datetime.utcnow().isoformat()
    }
    
    result = supabase.table("servicios").insert(nuevo_servicio).execute()
    return result.data[0]

# PUT - Actualizar servicio
@router.put("/{servicio_id}", response_model=ServicioResponse)
async def actualizar_servicio(
    servicio_id: int,
    servicio_update: ServicioUpdate,
    current_user: dict = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que existe
    existing = supabase.table("servicios").select("*").eq("id", servicio_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    update_data = {}
    
    if servicio_update.nombre:
        # Verificar nombre único
        name_check = supabase.table("servicios").select("id").eq("nombre", servicio_update.nombre).neq("id", servicio_id).execute()
        if name_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otro servicio con ese nombre"
            )
        update_data["nombre"] = servicio_update.nombre
    
    if servicio_update.descripcion is not None:
        update_data["descripcion"] = servicio_update.descripcion
    
    if servicio_update.hora_inicio:
        try:
            time.fromisoformat(servicio_update.hora_inicio)
            update_data["hora_inicio"] = servicio_update.hora_inicio
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de hora_inicio inválido"
            )
    
    if servicio_update.hora_fin:
        try:
            time.fromisoformat(servicio_update.hora_fin)
            update_data["hora_fin"] = servicio_update.hora_fin
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de hora_fin inválido"
            )
    
    # PERMITIR servicios nocturnos - no validar hora_fin > hora_inicio
    
    if servicio_update.dias_activo is not None:
        if not all(0 <= dia <= 6 for dia in servicio_update.dias_activo):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Días inválidos"
            )
        if len(servicio_update.dias_activo) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe seleccionar al menos un día activo"
            )
        update_data["dias_activo"] = servicio_update.dias_activo
    
    if servicio_update.intervalo_ronda_minutos:
        if servicio_update.intervalo_ronda_minutos < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El intervalo mínimo es de 5 minutos"
            )
        update_data["intervalo_ronda_minutos"] = servicio_update.intervalo_ronda_minutos
    
    if servicio_update.activo is not None:
        update_data["activo"] = servicio_update.activo
    
    update_data["ultima_modificacion"] = datetime.utcnow().isoformat()
    
    result = supabase.table("servicios").update(update_data).eq("id", servicio_id).execute()
    return result.data[0]

# DELETE - Eliminar servicio
@router.delete("/{servicio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_servicio(
    servicio_id: int,
    permanente: bool = False,
    current_user: dict = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que existe
    existing = supabase.table("servicios").select("id").eq("id", servicio_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    # Verificar si tiene puntos QR asociados
    puntos = supabase.table("puntos_control").select("id", count="exact").eq("servicio_id", servicio_id).execute()
    if puntos.count > 0 and permanente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar. Hay {puntos.count} puntos QR asociados a este servicio"
        )
    
    if permanente:
        # Eliminación permanente (solo si no hay puntos)
        supabase.table("servicios").delete().eq("id", servicio_id).execute()
    else:
        # Soft delete
        supabase.table("servicios").update({
            "activo": False,
            "ultima_modificacion": datetime.utcnow().isoformat()
        }).eq("id", servicio_id).execute()
    
    return None

# GET - Estadísticas de servicios
@router.get("/estadisticas/resumen")
async def estadisticas_servicios(current_user: dict = Depends(require_admin_or_supervisor)):
    supabase = get_supabase()
    
    total = supabase.table("servicios").select("id", count="exact").execute()
    activos = supabase.table("servicios").select("id", count="exact").eq("activo", True).execute()
    
    return {
        "total": total.count,
        "activos": activos.count,
        "inactivos": total.count - activos.count
    }