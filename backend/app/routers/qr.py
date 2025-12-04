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
        
        servicio_id = parts[1]
        punto_id = parts[3]
    except Exception:
        return QRValidationResponse(
            valid=False,
            message="Código QR inválido. Formato esperado: servicio:ID:punto:ID"
        )
    
    # Verificar que el punto QR existe
    response = supabase.table("puntos_qr").select(
        "*, servicios(nombre)"
    ).eq("id", punto_id).eq("servicio_id", servicio_id).execute()
    
    if not response.data:
        return QRValidationResponse(
            valid=False,
            message="Punto QR no encontrado o no pertenece al servicio especificado"
        )
    
    punto_data = response.data[0]
    
    # Verificar que el punto esté activo
    if not punto_data.get("activo", True):
        return QRValidationResponse(
            valid=False,
            message="Este punto QR está inactivo"
        )
    
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
        servicio_nombre=punto_data["servicios"]["nombre"],
        punto_id=punto_id,
        punto_nombre=punto_data["nombre"],
        punto_lat=punto_data["latitud"],
        punto_lng=punto_data["longitud"],
        message="QR válido"
    )