from fastapi import APIRouter, HTTPException, status, Depends
from app.models import UserLogin, Token, UserResponse
from app.auth import create_access_token, get_current_user
from app.database import get_supabase_client
from datetime import timedelta
from app.config import get_settings
import bcrypt

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()

@router.post("/test-password")
async def test_password(user_login: UserLogin):
    """Endpoint de prueba para debug"""
    supabase = get_supabase_client()
    
    # Buscar usuario
    response = supabase.table("usuarios").select("*").eq("email", user_login.email).execute()
    
    if not response.data:
        return {"error": "Usuario no encontrado"}
    
    user_data = response.data[0]
    
    # Intentar verificar
    password_bytes = user_login.password.encode('utf-8')
    hash_bytes = user_data["password_hash"].encode('utf-8')
    
    try:
        result = bcrypt.checkpw(password_bytes, hash_bytes)
        return {
            "email": user_login.email,
            "password_recibido": user_login.password,
            "hash_en_db": user_data["password_hash"],
            "password_match": result
        }
    except Exception as e:
        return {
            "error": str(e),
            "password": user_login.password,
            "hash": user_data["password_hash"]
        }

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    """
    Login de usuario con email y password.
    Retorna token JWT y datos del usuario.
    """
    supabase = get_supabase_client()
    
    # Buscar usuario por email con datos del servicio
    response = supabase.table("usuarios").select(
        "*, servicios(nombre)"
    ).eq("email", user_login.email).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    
    user_data = response.data[0]
    
    # Verificar contraseña directamente con bcrypt
    password_bytes = user_login.password.encode('utf-8')
    hash_bytes = user_data["password_hash"].encode('utf-8')
    
    if not bcrypt.checkpw(password_bytes, hash_bytes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    
    # Verificar que el usuario esté activo
    if not user_data.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador.",
        )
    
    # Crear token JWT
    access_token_expires = timedelta(minutes=settings.jwt_expiration_minutes)
    access_token = create_access_token(
        data={"sub": user_data["id"], "email": user_data["email"], "rol": user_data["rol"]},
        expires_delta=access_token_expires
    )
    
    # Preparar respuesta del usuario
    user_response = UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        nombre=user_data["nombre"],
        rol=user_data["rol"],
        servicio_id=user_data.get("servicio_id"),
        servicio_nombre=user_data["servicios"]["nombre"] if user_data.get("servicios") else None
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Obtiene información del usuario actual autenticado.
    """
    return current_user