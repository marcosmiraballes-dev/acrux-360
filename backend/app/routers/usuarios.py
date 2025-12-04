from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.auth import get_current_user, hash_password
from app.database import get_supabase
import uuid

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# Schemas adaptados a la estructura actual
class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    rol: str  # guardia, supervisor, administrador
    servicio_id: Optional[str] = None  # UUID como string
    telefono: Optional[str] = None
    activo: bool = True

class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = None
    rol: Optional[str] = None
    servicio_id: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class UsuarioResponse(BaseModel):
    id: str  # UUID
    email: str
    nombre: str
    rol: str
    servicio_id: Optional[str]
    telefono: Optional[str]
    activo: bool
    created_at: datetime
    updated_at: Optional[datetime]

# Dependency para verificar rol admin
def require_admin(current_user = Depends(get_current_user)):
    if current_user.rol not in ["admin", "administrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden acceder a este recurso"
        )
    return current_user

# GET - Listar todos los usuarios
@router.get("/", response_model=List[UsuarioResponse])
async def listar_usuarios(
    activo: Optional[bool] = None,
    rol: Optional[str] = None,
    current_user = Depends(require_admin)
):
    supabase = get_supabase()
    
    query = supabase.table("usuarios").select("*")
    
    if activo is not None:
        query = query.eq("activo", activo)
    if rol:
        query = query.eq("rol", rol)
    
    result = query.order("created_at", desc=True).execute()
    return result.data

# GET - Obtener usuario por ID
@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def obtener_usuario(
    usuario_id: str,
    current_user = Depends(require_admin)
):
    supabase = get_supabase()
    result = supabase.table("usuarios").select("*").eq("id", usuario_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return result.data[0]

# POST - Crear usuario
@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def crear_usuario(
    usuario: UsuarioCreate,
    current_user = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar si el email ya existe
    existing = supabase.table("usuarios").select("id").eq("email", usuario.email).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Validar rol
    if usuario.rol not in ["guardia", "supervisor", "administrador", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol inválido. Debe ser: guardia, supervisor o administrador"
        )
    
    # Hash de la contraseña
    hashed_password = hash_password(usuario.password)
    
    # Crear usuario
    nuevo_usuario = {
        "id": str(uuid.uuid4()),
        "email": usuario.email,
        "password_hash": hashed_password,
        "nombre": usuario.nombre,
        "rol": usuario.rol,
        "servicio_id": usuario.servicio_id,
        "telefono": usuario.telefono,
        "activo": usuario.activo,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = supabase.table("usuarios").insert(nuevo_usuario).execute()
    return result.data[0]

# PUT - Actualizar usuario
@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def actualizar_usuario(
    usuario_id: str,
    usuario_update: UsuarioUpdate,
    current_user = Depends(require_admin)
):
    supabase = get_supabase()
    
    # Verificar que el usuario existe
    existing = supabase.table("usuarios").select("*").eq("id", usuario_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Preparar datos para actualizar
    update_data = {}
    
    if usuario_update.email:
        # Verificar que el nuevo email no esté en uso
        email_check = supabase.table("usuarios").select("id").eq("email", usuario_update.email).neq("id", usuario_id).execute()
        if email_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso por otro usuario"
            )
        update_data["email"] = usuario_update.email
    
    if usuario_update.nombre:
        update_data["nombre"] = usuario_update.nombre
    if usuario_update.telefono is not None:
        update_data["telefono"] = usuario_update.telefono
    if usuario_update.activo is not None:
        update_data["activo"] = usuario_update.activo
    if usuario_update.servicio_id is not None:
        update_data["servicio_id"] = usuario_update.servicio_id
    
    if usuario_update.rol:
        if usuario_update.rol not in ["guardia", "supervisor", "administrador", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rol inválido"
            )
        update_data["rol"] = usuario_update.rol
    
    if usuario_update.password:
        update_data["password_hash"] = hash_password(usuario_update.password)
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("usuarios").update(update_data).eq("id", usuario_id).execute()
    return result.data[0]

# DELETE - Eliminar usuario (soft delete)
@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_usuario(
    usuario_id: str,
    current_user = Depends(require_admin)
):
    supabase = get_supabase()
    
    # No permitir eliminar al usuario actual
    if str(current_user.id) == usuario_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )
    
    # Verificar que el usuario existe
    existing = supabase.table("usuarios").select("id").eq("id", usuario_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Soft delete - marcar como inactivo
    supabase.table("usuarios").update({
        "activo": False,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", usuario_id).execute()
    
    return None

# GET - Estadísticas de usuarios
@router.get("/estadisticas/resumen")
async def estadisticas_usuarios(current_user = Depends(require_admin)):
    supabase = get_supabase()
    
    # Total usuarios activos
    activos = supabase.table("usuarios").select("id", count="exact").eq("activo", True).execute()
    
    # Por rol
    guardias = supabase.table("usuarios").select("id", count="exact").eq("rol", "guardia").eq("activo", True).execute()
    supervisores = supabase.table("usuarios").select("id", count="exact").eq("rol", "supervisor").eq("activo", True).execute()
    admins_count = supabase.table("usuarios").select("id", count="exact").eq("activo", True).execute()
    
    # Contar administradores (pueden ser "admin" o "administrador")
    admin_administrador = 0
    if admins_count.data:
        for user in admins_count.data:
            response_user = supabase.table("usuarios").select("rol").eq("id", user["id"]).execute()
            if response_user.data and response_user.data[0]["rol"] in ["admin", "administrador"]:
                admin_administrador += 1
    
    return {
        "total_activos": activos.count or 0,
        "guardias": guardias.count or 0,
        "supervisores": supervisores.count or 0,
        "administradores": admin_administrador
    }