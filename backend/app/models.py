from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

# ============ AUTH MODELS ============
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int  # INTEGER
    email: str
    nombre: str
    rol: Literal["guardia", "supervisor", "administrador"]
    servicio_id: Optional[int] = None  # INTEGER
    servicio_nombre: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ============ QR MODELS ============
class QRValidation(BaseModel):
    qr_data: str
    user_id: int  # INTEGER

class QRValidationResponse(BaseModel):
    valid: bool
    servicio_id: Optional[int] = None  # INTEGER
    servicio_nombre: Optional[str] = None
    punto_id: Optional[int] = None  # INTEGER
    punto_nombre: Optional[str] = None
    punto_lat: Optional[float] = None
    punto_lng: Optional[float] = None
    message: str

# ============ VISIT MODELS ============
class VisitCreate(BaseModel):
    servicio_id: int  # INTEGER
    punto_qr_id: int  # INTEGER
    guardia_id: int  # INTEGER
    tipo: Literal["normal", "observacion", "incidencia"] = "normal"
    observacion: Optional[str] = None
    latitud: float
    longitud: float
    fecha_hora: Optional[datetime] = None

class VisitResponse(BaseModel):
    id: int  # INTEGER
    servicio_id: int  # INTEGER
    punto_qr_id: int  # INTEGER
    guardia_id: int  # INTEGER
    tipo: str
    observacion: Optional[str]
    latitud: float
    longitud: float
    fecha_hora: datetime
    sincronizado: bool
    created_at: datetime

# ============ GPS VALIDATION ============
class GPSValidation(BaseModel):
    punto_lat: float
    punto_lng: float
    device_lat: float
    device_lng: float

# ============ PUNTO QR MODELS ============
class PuntoQRCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    latitud: float
    longitud: float
    servicio_id: int  # INTEGER
    radio_validacion: int = 50
    activo: bool = True

class PuntoQRUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    servicio_id: Optional[int] = None  # INTEGER
    radio_validacion: Optional[int] = None
    activo: Optional[bool] = None

class PuntoQRResponse(BaseModel):
    id: int  # INTEGER
    nombre: str
    descripcion: Optional[str]
    latitud: float
    longitud: float
    servicio_id: int  # INTEGER
    servicio_nombre: Optional[str]
    qr_code: str
    codigo_qr: str  # Alias
    radio_validacion: int
    activo: bool
    created_at: datetime
    updated_at: datetime

# ============ USUARIO MODELS (ADMIN) ============
class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    rol: Literal["guardia", "supervisor", "administrador"]
    servicio_id: Optional[int] = None  # INTEGER
    telefono: Optional[str] = None
    activo: bool = True

class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    nombre: Optional[str] = None
    rol: Optional[Literal["guardia", "supervisor", "administrador"]] = None
    servicio_id: Optional[int] = None  # INTEGER
    telefono: Optional[str] = None
    activo: Optional[bool] = None

class UsuarioResponse(BaseModel):
    id: int  # INTEGER
    email: str
    nombre: str
    rol: str
    servicio_id: Optional[int]  # INTEGER
    servicio_nombre: Optional[str]
    telefono: Optional[str]
    activo: bool
    created_at: datetime
    updated_at: Optional[datetime]