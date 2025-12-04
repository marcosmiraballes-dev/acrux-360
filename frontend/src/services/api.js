const API_BASE_URL = 'http://127.0.0.1:3001';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en la petición');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // AUTH
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // QR VALIDATION
  async validateQR(qrData, userId) {
    return this.request('/qr/validate', {
      method: 'POST',
      body: JSON.stringify({ qr_data: qrData, user_id: userId }),
    });
  }

  // VISITS
  async createVisit(visitData) {
    return this.request('/visits/', {
      method: 'POST',
      body: JSON.stringify(visitData),
    });
  }

  async getVisits(servicioId = null) {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return this.request(`/visits/${query}`);
  }

  async syncOfflineVisits(visits) {
    return this.request('/visits/sync', {
      method: 'POST',
      body: JSON.stringify(visits),
    });
  }

  // GPS VALIDATION
  async validateGPS(puntoLat, puntoLng, deviceLat, deviceLng) {
    return this.request('/visits/validate-gps', {
      method: 'POST',
      body: JSON.stringify({
        punto_lat: puntoLat,
        punto_lng: puntoLng,
        device_lat: deviceLat,
        device_lng: deviceLng,
      }),
    });
  }

  // PUNTOS QR
  async getPuntos(servicioId = null) {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return this.request(`/puntos/${query}`);
  }

  async getPunto(puntoId) {
    return this.request(`/puntos/${puntoId}`);
  }

  // ALERTAS
  async getAlertas(servicioId = null) {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return this.request(`/alertas/${query}`);
  }

  async getAlertasCount(servicioId = null) {
    const query = servicioId ? `?servicio_id=${servicioId}` : '';
    return this.request(`/alertas/count${query}`);
  }
}

export default new ApiService();