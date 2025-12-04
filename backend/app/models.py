from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

# ============ AUTH MODELS ============
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    nombre: str
    rol: Literal["guardia", "supervisor", "administrador"]
    servicio_id: Optional[str] = None
    servicio_nombre: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ============ QR MODELS ============
class QRValidation(BaseModel):
    qr_data: str
    user_id: str

class QRValidationResponse(BaseModel):
    valid: bool
    servicio_id: Optional[str] = None
    servicio_nombre: Optional[str] = None
    punto_id: Optional[str] = None
    punto_nombre: Optional[str] = None
    punto_lat: Optional[float] = None
    punto_lng: Optional[float] = None
    message: str

# ============ VISIT MODELS ============
class VisitCreate(BaseModel):
    servicio_id: str
    punto_qr_id: str
    guardia_id: str
    tipo: Literal["normal", "observacion", "incidencia"] = "normal"
    observacion: Optional[str] = None
    latitud: float
    longitud: float
    fecha_hora: Optional[datetime] = None

class VisitResponse(BaseModel):
    id: str
    servicio_id: str
    punto_qr_id: str
    guardia_id: str
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