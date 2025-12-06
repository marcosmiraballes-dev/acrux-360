from fastapi import APIRouter, HTTPException, status, Depends
from app.models import QRValidation, QRValidationResponse, UserResponse
from app.database import get_supabase_client
from app.auth import get_current_user

router = APIRouter(prefix="/qr", tags=["QR Validation"])

@router.post("/validate", response_model=QRValidationResponse)
async def validate_qr(
    qr_validation: QRValidation,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Valida un código QR escaneado.
    Formato esperado: "servicio:SERVICE_ID:punto:POINT_ID"
    
    Verifica:
    1. Formato del QR
    2. Existencia del punto QR
    3. Que el usuario tenga acceso al servicio
    """
    supabase = get_supabase_client()
    
    # Parsear datos del QR
    try:
        parts = qr_validation.qr_data.split(":")
        if len(parts) != 4 or parts[0] != "servicio" or parts[2] != "punto":
            raise ValueError("Formato inválido")
        
        servicio_id = int(parts[1])  # CORREGIDO: convertir a int
        punto_id = int(parts[3])     # CORREGIDO: convertir a int
    except Exception:
        return QRValidationResponse(
            valid=False,
            message="Código QR inválido. Formato esperado: servicio:ID:punto:ID"
        )
    
    # Verificar que el punto QR existe (SIN JOIN)
    response = supabase.table("puntos_qr").select("*").eq("id", punto_id).execute()
    
    if not response.data:
        return QRValidationResponse(
            valid=False,
            message="Punto QR no encontrado"
        )
    
    punto_data = response.data[0]
    
    # Verificar que el punto esté activo
    if not punto_data.get("activo", True):
        return QRValidationResponse(
            valid=False,
            message="Este punto QR está inactivo"
        )
    
    # Obtener nombre del servicio (query separada)
    servicio_nombre = None
    try:
        servicio_response = supabase.table("servicios").select("nombre").eq("id", servicio_id).execute()
        if servicio_response.data:
            servicio_nombre = servicio_response.data[0].get("nombre")
    except:
        pass
    
    # Verificar permisos del usuario según su rol
    if current_user.rol == "guardia" or current_user.rol == "supervisor":
        # Guardias y supervisores solo pueden escanear QR de su servicio
        if current_user.servicio_id != servicio_id:
            return QRValidationResponse(
                valid=False,
                message="No tienes acceso a este servicio"
            )
    
    # Si todo está OK, retornar datos del punto
    return QRValidationResponse(
        valid=True,
        servicio_id=servicio_id,
        servicio_nombre=servicio_nombre,
        punto_id=punto_id,
        punto_nombre=punto_data["nombre"],
        punto_lat=punto_data["latitud"],
        punto_lng=punto_data["longitud"],
        message="QR válido"
    )