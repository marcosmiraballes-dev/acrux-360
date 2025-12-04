const API_URL = 'http://127.0.0.1:3001';

// Helper para obtener token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper para limpiar parámetros (eliminar null, undefined, '')
const cleanParams = (params) => {
  const clean = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== '' && params[key] !== undefined) {
      clean[key] = params[key];
    }
  });
  return clean;
};

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error en la solicitud' }));
    throw new Error(error.detail || `Error ${response.status}`);
  }
  
  // Si es 204 No Content, retornar null
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

// ============ USUARIOS ============
export const usuariosAPI = {
  listar: async (params = {}) => {
    const cleaned = cleanParams(params);
    const queryString = new URLSearchParams(cleaned).toString();
    const url = `${API_URL}/usuarios/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  obtener: async (id) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  crear: async (usuario) => {
    const response = await fetch(`${API_URL}/usuarios/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(usuario)
    });
    
    return handleResponse(response);
  },

  actualizar: async (id, usuario) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(usuario)
    });
    
    return handleResponse(response);
  },

  eliminar: async (id) => {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  estadisticas: async () => {
    const response = await fetch(`${API_URL}/usuarios/estadisticas/resumen`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
};

// ============ SERVICIOS ============
export const serviciosAPI = {
  listar: async (params = {}) => {
    const cleaned = cleanParams(params);
    const queryString = new URLSearchParams(cleaned).toString();
    const url = `${API_URL}/servicios/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  obtener: async (id) => {
    const response = await fetch(`${API_URL}/servicios/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  crear: async (servicio) => {
    const response = await fetch(`${API_URL}/servicios/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(servicio)
    });
    
    return handleResponse(response);
  },

  actualizar: async (id, servicio) => {
    const response = await fetch(`${API_URL}/servicios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(servicio)
    });
    
    return handleResponse(response);
  },

  eliminar: async (id, permanente = false) => {
    const url = `${API_URL}/servicios/${id}${permanente ? '?permanente=true' : ''}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  estadisticas: async () => {
    const response = await fetch(`${API_URL}/servicios/estadisticas/resumen`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
};

// ============ PUNTOS QR ============
export const puntosAdminAPI = {
  listar: async (params = {}) => {
    const cleaned = cleanParams(params);
    const queryString = new URLSearchParams(cleaned).toString();
    const url = `${API_URL}/admin/puntos/${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  obtener: async (id) => {
    const response = await fetch(`${API_URL}/admin/puntos/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  crear: async (punto) => {
    const response = await fetch(`${API_URL}/admin/puntos/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(punto)
    });
    
    return handleResponse(response);
  },

  actualizar: async (id, punto) => {
    const response = await fetch(`${API_URL}/admin/puntos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(punto)
    });
    
    return handleResponse(response);
  },

  eliminar: async (id, permanente = false) => {
    const url = `${API_URL}/admin/puntos/${id}${permanente ? '?permanente=true' : ''}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  },

  estadisticas: async () => {
    const response = await fetch(`${API_URL}/admin/puntos/estadisticas/resumen`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return handleResponse(response);
  }
};