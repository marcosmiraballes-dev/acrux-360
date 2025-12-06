from fastapi import APIRouter, Depends, HTTPException, status
from app.models import UserResponse
from app.database import get_supabase_client
from app.auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter(prefix="/alertas", tags=["Alertas"])

class AlertaResponse(BaseModel):
    punto_id: int  # CORREGIDO: int en lugar de str
    punto_nombre: str
    ultima_visita: datetime | None
    minutos_sin_visitar: int | None
    tipo: str  # "sin_visitar", "incidencia"
    prioridad: str  # "baja", "media", "alta"

@router.get("/", response_model=List[AlertaResponse])
async def get_alertas(
    servicio_id: Optional[int] = None,  # CORREGIDO: int en lugar de str
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Obtiene alertas de puntos sin visitar.
    - Supervisor: solo alertas de su servicio
    - Administrador: puede filtrar por servicio o ver todos
    """
    supabase = get_supabase_client()
    
    # Determinar servicio a consultar
    if current_user.rol == "supervisor":
        if not current_user.servicio_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supervisor sin servicio asignado"
            )
        target_servicio = current_user.servicio_id
    elif current_user.rol in ["administrador", "admin"]:
        target_servicio = servicio_id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver alertas"
        )
    
    # Obtener puntos del servicio
    query_puntos = supabase.table("puntos_qr").select("*").eq("activo", True)
    if target_servicio:
        query_puntos = query_puntos.eq("servicio_id", target_servicio)
    
    puntos_response = query_puntos.execute()
    puntos = puntos_response.data
    
    # Obtener todas las visitas
    query_visitas = supabase.table("visitas").select("*")
    if target_servicio:
        query_visitas = query_visitas.eq("servicio_id", target_servicio)
    
    visitas_response = query_visitas.execute()
    visitas = visitas_response.data
    
    # Crear mapa de última visita por punto
    ultima_visita_map = {}
    for visita in visitas:
        punto_id = visita["punto_qr_id"]
        fecha_visita = datetime.fromisoformat(visita["fecha_hora"].replace('Z', '+00:00'))
        
        if punto_id not in ultima_visita_map or fecha_visita > ultima_visita_map[punto_id]:
            ultima_visita_map[punto_id] = fecha_visita
    
    # Generar alertas
    alertas = []
    now = datetime.utcnow()
    tiempo_alerta_minutos = 70  # Alertar si no se visita en 70 minutos
    
    for punto in puntos:
        punto_id = punto["id"]
        ultima_visita = ultima_visita_map.get(punto_id)
        
        if ultima_visita is None:
            # Nunca visitado
            alertas.append(AlertaResponse(
                punto_id=punto_id,
                punto_nombre=punto["nombre"],
                ultima_visita=None,
                minutos_sin_visitar=None,
                tipo="sin_visitar",
                prioridad="alta"
            ))
        else:
            # Calcular tiempo sin visitar
            minutos_sin_visitar = int((now - ultima_visita).total_seconds() / 60)
            
            if minutos_sin_visitar > tiempo_alerta_minutos:
                # Determinar prioridad
                if minutos_sin_visitar > 180:  # 3 horas
                    prioridad = "alta"
                elif minutos_sin_visitar > 120:  # 2 horas
                    prioridad = "media"
                else:
                    prioridad = "baja"
                
                alertas.append(AlertaResponse(
                    punto_id=punto_id,
                    punto_nombre=punto["nombre"],
                    ultima_visita=ultima_visita,
                    minutos_sin_visitar=minutos_sin_visitar,
                    tipo="sin_visitar",
                    prioridad=prioridad
                ))
    
    # Ordenar por prioridad y tiempo
    prioridad_orden = {"alta": 0, "media": 1, "baja": 2}
    alertas.sort(key=lambda x: (prioridad_orden[x.prioridad], x.minutos_sin_visitar or 999999), reverse=True)
    
    return alertas

@router.get("/count")
async def get_alertas_count(
    servicio_id: Optional[int] = None,  # CORREGIDO: int en lugar de str
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Obtiene el número total de alertas activas.
    """
    alertas = await get_alertas(servicio_id, current_user)
    
    return {
        "total": len(alertas),
        "alta": len([a for a in alertas if a.prioridad == "alta"]),
        "media": len([a for a in alertas if a.prioridad == "media"]),
        "baja": len([a for a in alertas if a.prioridad == "baja"])
    }