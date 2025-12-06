from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings
from app.database import get_supabase_client
from app.models import UserResponse

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que la contraseña coincida con el hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera hash de contraseña"""
    return pwd_context.hash(password)

def hash_password(password: str) -> str:
    """Genera hash de contraseña (alias de get_password_hash para compatibilidad)"""
    return get_password_hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decodifica token JWT"""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserResponse:
    """Obtiene el usuario actual desde el token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    # CORREGIDO: user_id ahora se maneja como int
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
        )
    
    # Convertir a int (era str antes)
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID de usuario inválido en token",
        )
    
    # Obtener usuario de Supabase SIN JOIN
    supabase = get_supabase_client()
    response = supabase.table("usuarios").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    
    user_data = response.data[0]
    
    # Verificar que el usuario esté activo
    if not user_data.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Obtener nombre del servicio si existe servicio_id
    servicio_nombre = None
    if user_data.get("servicio_id"):
        try:
            servicio_response = supabase.table("servicios").select("nombre").eq("id", user_data["servicio_id"]).execute()
            if servicio_response.data:
                servicio_nombre = servicio_response.data[0]["nombre"]
        except:
            pass
    
    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        nombre=user_data["nombre"],
        rol=user_data["rol"],
        servicio_id=user_data.get("servicio_id"),
        servicio_nombre=servicio_nombre
    )

def require_role(allowed_roles: list[str]):
    """Decorator para requerir roles específicos"""
    async def role_checker(current_user: UserResponse = Depends(get_current_user)):
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere rol: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker