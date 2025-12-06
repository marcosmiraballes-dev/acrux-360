from fastapi import APIRouter, HTTPException, status, Depends
from app.models import VisitCreate, VisitResponse, UserResponse, GPSValidation
from app.database import get_supabase_client
from app.auth import get_current_user
from app.config import get_settings
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from typing import List, Optional

router = APIRouter(prefix="/visits", tags=["Visits"])
settings = get_settings()

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calcula la distancia en metros entre dos coordenadas GPS usando la fórmula de Haversine.
    """
    R = 6371000  # Radio de la Tierra en metros
    
    phi1 = radians(lat1)
    phi2 = radians(lat2)
    delta_phi = radians(lat2 - lat1)
    delta_lambda = radians(lon2 - lon1)
    
    a = sin(delta_phi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    distance = R * c
    return distance

@router.post("/validate-gps")
async def validate_gps(gps_data: GPSValidation):
    """
    Valida que la ubicación del dispositivo esté dentro del radio permitido.
    """
    distance = calculate_distance(
        gps_data.punto_lat,
        gps_data.punto_lng,
        gps_data.device_lat,
        gps_data.device_lng
    )
    
    is_valid = distance <= settings.gps_radius_meters
    
    return {
        "valid": is_valid,
        "distance_meters": round(distance, 2),
        "max_allowed_meters": settings.gps_radius_meters,
        "message": "Ubicación válida" if is_valid else f"Estás a {round(distance, 2)}m del punto. Máximo permitido: {settings.gps_radius_meters}m"
    }

@router.post("/", response_model=VisitResponse)
async def create_visit(
    visit: VisitCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Registra una nueva visita a un punto QR.
    
    Validaciones:
    1. Usuario tiene acceso al servicio
    2. Punto QR existe y está activo
    3. Ubicación GPS es válida (dentro del radio)
    4. Guardia existe y pertenece al servicio
    """
    supabase = get_supabase_client()
    
    # Verificar acceso al servicio
    if current_user.rol in ["guardia", "supervisor"]:
        if current_user.servicio_id != visit.servicio_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este servicio"
            )
    
    # Verificar que el punto QR existe y obtener sus coordenadas
    punto_response = supabase.table("puntos_qr").select("*").eq(
        "id", visit.punto_qr_id
    ).eq("servicio_id", visit.servicio_id).execute()
    
    if not punto_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    punto = punto_response.data[0]
    
    if not punto.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El punto QR está inactivo"
        )
    
    # Validar GPS
    distance = calculate_distance(
        punto["latitud"],
        punto["longitud"],
        visit.latitud,
        visit.longitud
    )
    
    if distance > settings.gps_radius_meters:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ubicación inválida. Estás a {round(distance, 2)}m del punto. Máximo: {settings.gps_radius_meters}m"
        )
    
    # Verificar que el guardia existe y pertenece al servicio
    guardia_response = supabase.table("usuarios").select("*").eq(
        "id", visit.guardia_id
    ).eq("servicio_id", visit.servicio_id).eq("rol", "guardia").execute()
    
    if not guardia_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guardia no encontrado o no pertenece a este servicio"
        )
    
    # Preparar datos de la visita
    visit_data = {
        "servicio_id": visit.servicio_id,
        "punto_qr_id": visit.punto_qr_id,
        "guardia_id": visit.guardia_id,
        "tipo": visit.tipo,
        "observacion": visit.observacion,
        "latitud": visit.latitud,
        "longitud": visit.longitud,
        "fecha_hora": visit.fecha_hora.isoformat() if visit.fecha_hora else datetime.utcnow().isoformat(),
        "sincronizado": True
    }
    
    # Guardar visita
    response = supabase.table("visitas").insert(visit_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar la visita"
        )
    
    saved_visit = response.data[0]
    
    return VisitResponse(
        id=saved_visit["id"],
        servicio_id=saved_visit["servicio_id"],
        punto_qr_id=saved_visit["punto_qr_id"],
        guardia_id=saved_visit["guardia_id"],
        tipo=saved_visit["tipo"],
        observacion=saved_visit.get("observacion"),
        latitud=saved_visit["latitud"],
        longitud=saved_visit["longitud"],
        fecha_hora=datetime.fromisoformat(saved_visit["fecha_hora"]),
        sincronizado=saved_visit["sincronizado"],
        created_at=datetime.fromisoformat(saved_visit["created_at"])
    )

@router.get("/", response_model=List[VisitResponse])
async def get_visits(
    servicio_id: Optional[int] = None,  # CORREGIDO: int en lugar de str
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Obtiene listado de visitas.
    - Guardia: solo sus propias visitas
    - Supervisor: visitas de su servicio
    - Administrador: todas las visitas (puede filtrar por servicio_id)
    """
    supabase = get_supabase_client()
    
    query = supabase.table("visitas").select("*")
    
    if current_user.rol == "guardia":
        # Guardia solo ve sus propias visitas
        query = query.eq("guardia_id", current_user.id)
    elif current_user.rol == "supervisor":
        # Supervisor ve visitas de su servicio
        query = query.eq("servicio_id", current_user.servicio_id)
    elif current_user.rol in ["administrador", "admin"] and servicio_id:
        # Administrador puede filtrar por servicio
        query = query.eq("servicio_id", servicio_id)
    
    # Ordenar por fecha más reciente
    query = query.order("fecha_hora", desc=True).limit(100)
    
    response = query.execute()
    
    visits = []
    for visit_data in response.data:
        visits.append(VisitResponse(
            id=visit_data["id"],
            servicio_id=visit_data["servicio_id"],
            punto_qr_id=visit_data["punto_qr_id"],
            guardia_id=visit_data["guardia_id"],
            tipo=visit_data["tipo"],
            observacion=visit_data.get("observacion"),
            latitud=visit_data["latitud"],
            longitud=visit_data["longitud"],
            fecha_hora=datetime.fromisoformat(visit_data["fecha_hora"]),
            sincronizado=visit_data["sincronizado"],
            created_at=datetime.fromisoformat(visit_data["created_at"])
        ))
    
    return visits

@router.post("/sync")
async def sync_offline_visits(
    visits: List[VisitCreate],
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Sincroniza múltiples visitas guardadas offline.
    Retorna las que se sincronizaron correctamente y las que fallaron.
    """
    supabase = get_supabase_client()
    
    results = {
        "success": [],
        "failed": []
    }
    
    for visit in visits:
        try:
            # Validar acceso al servicio
            if current_user.rol in ["guardia", "supervisor"]:
                if current_user.servicio_id != visit.servicio_id:
                    results["failed"].append({
                        "visit": visit.dict(),
                        "error": "No tienes acceso a este servicio"
                    })
                    continue
            
            # Preparar datos
            visit_data = {
                "servicio_id": visit.servicio_id,
                "punto_qr_id": visit.punto_qr_id,
                "guardia_id": visit.guardia_id,
                "tipo": visit.tipo,
                "observacion": visit.observacion,
                "latitud": visit.latitud,
                "longitud": visit.longitud,
                "fecha_hora": visit.fecha_hora.isoformat() if visit.fecha_hora else datetime.utcnow().isoformat(),
                "sincronizado": True
            }
            
            # Guardar
            response = supabase.table("visitas").insert(visit_data).execute()
            
            if response.data:
                results["success"].append(response.data[0]["id"])
            else:
                results["failed"].append({
                    "visit": visit.dict(),
                    "error": "Error al guardar"
                })
                
        except Exception as e:
            results["failed"].append({
                "visit": visit.dict(),
                "error": str(e)
            })
    
    return results