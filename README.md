# Sistema de Recorridas QR - Acrux 360

Sistema de control de rondas para servicios de seguridad con validación GPS y funcionalidad offline.

## 🚀 Tecnologías

- **Backend**: Python + FastAPI
- **Frontend**: React + Vite (PWA)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT
- **Storage offline**: IndexedDB

## 📋 Características

- ✅ Escaneo de códigos QR
- ✅ Validación GPS (radio de 50m)
- ✅ Modo offline con sincronización automática
- ✅ Jerarquía de usuarios (Guardia/Supervisor/Admin)
- ✅ Registro de visitas con observaciones
- ✅ Historial de recorridas

## 🛠️ Instalación

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Configuración

Crear archivo `backend/.env`:
```
SUPABASE_URL=tu_url_supabase
SUPABASE_KEY=tu_key_supabase
JWT_SECRET_KEY=tu_secret_key
```

## 📱 Uso

1. Acceder a http://localhost:5174
2. Login con credenciales
3. Escanear código QR del punto de control
4. Registrar visita con observaciones

## 👤 Credenciales de prueba

- **Guardia**: guardia@ejemplo.com / password123
- **Supervisor**: supervisor@ejemplo.com / password123
- **Admin**: admin@ejemplo.com / password123