from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, FileResponse
from typing import List
from pydantic import BaseModel
from app.auth import get_current_user
from app.database import get_supabase
import qrcode
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
import os
import tempfile

router = APIRouter(prefix="/qr-generator", tags=["qr-generator"])

class QRGenerateRequest(BaseModel):
    punto_ids: List[str]  # Lista de IDs de puntos QR

# Dependency para admin
def require_admin(current_user = Depends(get_current_user)):
    if current_user.rol not in ["admin", "administrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden generar códigos QR"
        )
    return current_user

@router.get("/punto/{punto_id}")
async def generar_qr_individual(
    punto_id: str,
    size: int = 300,
    current_user = Depends(require_admin)
):
    """
    Genera un código QR individual para un punto específico
    Retorna una imagen PNG
    """
    supabase = get_supabase()
    
    # Obtener punto
    result = supabase.table("puntos_qr").select("*").eq("id", punto_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    punto = result.data[0]
    
    # Generar QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    qr.add_data(punto["qr_code"])
    qr.make(fit=True)
    
    # Crear imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Redimensionar si es necesario
    if size != 300:
        img = img.resize((size, size))
    
    # Convertir a bytes
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename=qr_{punto['nombre'].replace(' ', '_')}.png"
        }
    )

@router.post("/generar-pdf")
async def generar_qr_pdf(
    request: QRGenerateRequest,
    current_user = Depends(require_admin)
):
    """
    Genera un PDF con múltiples códigos QR
    4 QR por página en formato A4
    """
    supabase = get_supabase()
    
    if not request.punto_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe seleccionar al menos un punto"
        )
    
    # Obtener puntos
    puntos = []
    for punto_id in request.punto_ids:
        result = supabase.table("puntos_qr").select("*").eq("id", punto_id).execute()
        if result.data:
            puntos.append(result.data[0])
    
    if not puntos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron puntos válidos"
        )
    
    # Crear PDF temporal
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_pdf_path = temp_pdf.name
    temp_pdf.close()
    
    # Crear PDF
    c = canvas.Canvas(temp_pdf_path, pagesize=A4)
    width, height = A4
    
    # Configuración de layout (2x2 = 4 QR por página)
    qr_size = 2.5 * inch  # Tamaño del QR
    margin = 0.75 * inch
    spacing_x = (width - 2 * margin - 2 * qr_size) / 1
    spacing_y = (height - 2 * margin - 2 * qr_size) / 1
    
    positions = [
        (margin, height - margin - qr_size),  # Top-left
        (margin + qr_size + spacing_x, height - margin - qr_size),  # Top-right
        (margin, height - margin - 2 * qr_size - spacing_y),  # Bottom-left
        (margin + qr_size + spacing_x, height - margin - 2 * qr_size - spacing_y),  # Bottom-right
    ]
    
    for idx, punto in enumerate(puntos):
        # Nueva página cada 4 QR
        if idx > 0 and idx % 4 == 0:
            c.showPage()
        
        position_idx = idx % 4
        x, y = positions[position_idx]
        
        # Generar QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=2,
        )
        qr.add_data(punto["qr_code"])
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir a BytesIO
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Dibujar QR en PDF
        c.drawImage(ImageReader(buffer), x, y, width=qr_size, height=qr_size)
        
        # Título del punto
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x, y + qr_size + 10, punto["nombre"])
        
        # Código QR
        c.setFont("Helvetica", 9)
        c.drawString(x, y - 20, f"Código: {punto['qr_code']}")
        
        # Descripción (si existe)
        if punto.get("descripcion"):
            c.setFont("Helvetica", 8)
            # Truncar descripción si es muy larga
            desc = punto["descripcion"][:50] + "..." if len(punto["descripcion"]) > 50 else punto["descripcion"]
            c.drawString(x, y - 35, desc)
    
    # Agregar footer en cada página
    c.setFont("Helvetica", 8)
    c.drawString(margin, 0.5 * inch, "Sistema de Recorridas QR - Acrux 360")
    
    c.save()
    
    # Retornar archivo PDF
    return FileResponse(
        temp_pdf_path,
        media_type="application/pdf",
        filename="codigos_qr_acrux.pdf",
        headers={
            "Content-Disposition": "attachment; filename=codigos_qr_acrux.pdf"
        }
    )

@router.get("/preview/{punto_id}")
async def preview_qr(
    punto_id: str,
    current_user = Depends(get_current_user)
):
    """
    Vista previa del QR en base64 para mostrar en el navegador
    """
    supabase = get_supabase()
    
    # Obtener punto
    result = supabase.table("puntos_qr").select("*").eq("id", punto_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Punto QR no encontrado"
        )
    
    punto = result.data[0]
    
    # Generar QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    qr.add_data(punto["qr_code"])
    qr.make(fit=True)
    
    # Crear imagen pequeña para preview
    img = qr.make_image(fill_color="black", back_color="white")
    img = img.resize((300, 300))
    
    # Convertir a bytes
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="image/png")