from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Cliente de Supabase
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

def get_supabase_client() -> Client:
    """Retorna el cliente de Supabase"""
    return supabase

def get_supabase() -> Client:
    """Alias de get_supabase_client para compatibilidad con nuevos routers"""
    return supabase