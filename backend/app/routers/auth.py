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
    
    print(f"\n=== DEBUG LOGIN ===")
    print(f"Email recibido: {user_login.email}")
    print(f"Password recibido: {user_login.password}")
    
    # Buscar usuario SIN JOIN - solo de la tabla usuarios
    result = supabase.table("usuarios").select("*").eq("email", user_login.email).execute()
    
    print(f"Resultado de búsqueda: {result.data}")
    
    if not result.data:
        print(f"❌ Usuario no encontrado en BD")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    user = result.data[0]
    print(f"✅ Usuario encontrado:")
    print(f"  - ID: {user['id']} (tipo: {type(user['id'])})")
    print(f"  - Email: {user['email']}")
    print(f"  - Nombre: {user['nombre']}")
    print(f"  - Activo: {user.get('activo')}")
    print(f"  - Password hash: {user['password_hash'][:30]}...")
    
    # Verificar contraseña
    password_valido = verify_password(user_login.password, user["password_hash"])
    print(f"Verificación de password: {password_valido}")
    
    if not password_valido:
        print(f"❌ Password incorrecto")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar que el usuario esté activo
    if not user.get("activo", True):
        print(f"❌ Usuario inactivo")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Asegurar que el ID sea int
    user_id = int(user["id"])
    print(f"✅ Usuario ID convertido a int: {user_id}")
    
    # Crear token
    access_token_expires = timedelta(minutes=settings.jwt_expiration_minutes)
    access_token = create_access_token(
    data={"sub": str(user_id), "email": user["email"], "rol": user["rol"]},        expires_delta=access_token_expires
    )
    
    print(f"✅ Token creado exitosamente")
    
    # Obtener nombre del servicio si existe
    servicio_nombre = None
    servicio_id = user.get("servicio_id")
    
    if servicio_id:
        try:
            servicio_result = supabase.table("servicios").select("nombre").eq("id", servicio_id).execute()
            if servicio_result.data:
                servicio_nombre = servicio_result.data[0]["nombre"]
        except Exception as e:
            print(f"⚠️ Error obteniendo servicio: {e}")
    
    print(f"=== FIN DEBUG LOGIN ===\n")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user["email"],
            "nombre": user["nombre"],
            "rol": user["rol"],
            "servicio_id": servicio_id,
            "servicio_nombre": servicio_nombre
        }
    }

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user