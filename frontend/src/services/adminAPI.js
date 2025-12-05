const API_BASE_URL = 'http://127.0.0.1:3001';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Función para limpiar parámetros null/undefined
const cleanParams = (params) => {
  const cleaned = {};
  for (const key in params) {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      cleaned[key] = params[key];
    }
  }
  return cleaned;
};

// ============ USUARIOS ============
export const usuariosAPI = {
  async listar() {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener usuarios');
    return response.json();
  },

  async crear(usuario) {
    const cleanedData = cleanParams(usuario);
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear usuario');
    }
    return response.json();
  },

  async actualizar(id, usuario) {
    const cleanedData = cleanParams(usuario);
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar usuario');
    }
    return response.json();
  },

  async eliminar(id) {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al eliminar usuario');
    }
    return response.json();
  },

  async estadisticas() {
    // Como no existe el endpoint, calculamos las estadísticas del lado del cliente
    const usuarios = await this.listar();
    return {
      total: usuarios.length,
      total_activos: usuarios.filter(u => u.activo).length,
      guardias: usuarios.filter(u => u.rol === 'guardia').length,
      supervisores: usuarios.filter(u => u.rol === 'supervisor').length,
      administradores: usuarios.filter(u => u.rol === 'admin' || u.rol === 'administrador').length
    };
  }
};

// ============ SERVICIOS ============
export const serviciosAPI = {
  async listar() {
    const response = await fetch(`${API_BASE_URL}/servicios`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener servicios');
    return response.json();
  },

  async crear(servicio) {
    const cleanedData = cleanParams(servicio);
    const response = await fetch(`${API_BASE_URL}/servicios`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear servicio');
    }
    return response.json();
  },

  async actualizar(id, servicio) {
    const cleanedData = cleanParams(servicio);
    const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar servicio');
    }
    return response.json();
  },

  async eliminar(id) {
    const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al eliminar servicio');
    }
    return response.json();
  },

  async estadisticas() {
    // Como no existe el endpoint, calculamos las estadísticas del lado del cliente
    const servicios = await this.listar();
    return {
      total: servicios.length,
      activos: servicios.filter(s => s.activo).length,
      inactivos: servicios.filter(s => !s.activo).length
    };
  }
};

// ============ PUNTOS QR (ADMIN) ============
export const puntosAdminAPI = {
  async listar() {
    const response = await fetch(`${API_BASE_URL}/admin/puntos`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener puntos QR');
    return response.json();
  },

  async crear(punto) {
    const cleanedData = cleanParams(punto);
    const response = await fetch(`${API_BASE_URL}/admin/puntos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al crear punto QR');
    }
    return response.json();
  },

  async actualizar(id, punto) {
    const cleanedData = cleanParams(punto);
    const response = await fetch(`${API_BASE_URL}/admin/puntos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cleanedData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al actualizar punto QR');
    }
    return response.json();
  },

  async eliminar(id) {
    const response = await fetch(`${API_BASE_URL}/admin/puntos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al eliminar punto QR');
    }
    return response.json();
  },

  async estadisticas() {
    // Como no existe el endpoint, calculamos las estadísticas del lado del cliente
    const puntos = await this.listar();
    return {
      total: puntos.length,
      activos: puntos.filter(p => p.activo).length,
      inactivos: puntos.filter(p => !p.activo).length
    };
  }
};

// ============ REPORTES ============
export const reportesAPI = {
  async getReporteVisitas(queryParams = '') {
    const response = await fetch(`${API_BASE_URL}/reportes/visitas?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener reporte de visitas');
    return response.json();
  },

  async getRankingPuntos(queryParams = '') {
    const response = await fetch(`${API_BASE_URL}/reportes/puntos-ranking?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener ranking de puntos');
    return response.json();
  },

  async getReporteAlertas(queryParams = '') {
    const response = await fetch(`${API_BASE_URL}/reportes/alertas?${queryParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al obtener reporte de alertas');
    return response.json();
  },

  async exportarExcel(queryParams = '') {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reportes/exportar-excel?${queryParams}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Error al exportar Excel');
    return response.blob();
  },

  async exportarPDF(queryParams = '') {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reportes/exportar-pdf?${queryParams}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Error al exportar PDF');
    return response.blob();
  }
};