from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from app.auth import verify_password, create_access_token, get_current_user
from app.database import get_supabase_client
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    supabase = get_supabase_client()
    
    # Buscar usuario SIN JOIN - solo de la tabla usuarios
    result = supabase.table("usuarios").select("*").eq("email", user_login.email).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    user = result.data[0]
    
    # Verificar contraseña
    if not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar que el usuario esté activo
    if not user.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear token
    access_token_expires = timedelta(minutes=settings.jwt_expiration_minutes)
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "rol": user["rol"]},
        expires_delta=access_token_expires
    )
    
    # Obtener nombre del servicio si existe
    servicio_nombre = None
    if user.get("servicio_id"):
        try:
            servicio_result = supabase.table("servicios").select("nombre").eq("id", user["servicio_id"]).execute()
            if servicio_result.data:
                servicio_nombre = servicio_result.data[0]["nombre"]
        except:
            pass
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "nombre": user["nombre"],
            "rol": user["rol"],
            "servicio_id": user.get("servicio_id"),
            "servicio_nombre": servicio_nombre
        }
    }

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user