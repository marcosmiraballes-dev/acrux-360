import localforage from 'localforage';

// Configurar localforage
localforage.config({
  name: 'RecorridasQR',
  storeName: 'visits',
  description: 'Almacenamiento offline de visitas'
});

class StorageService {
  // Guardar visita offline
  async saveVisitOffline(visit) {
    try {
      const visits = await this.getOfflineVisits();
      const newVisit = {
        ...visit,
        id: `offline-${Date.now()}`,
        syncronizado: false,
        created_at: new Date().toISOString()
      };
      visits.push(newVisit);
      await localforage.setItem('offline-visits', visits);
      return newVisit;
    } catch (error) {
      console.error('Error saving offline visit:', error);
      throw error;
    }
  }

  // Obtener visitas offline
  async getOfflineVisits() {
    try {
      const visits = await localforage.getItem('offline-visits');
      return visits || [];
    } catch (error) {
      console.error('Error getting offline visits:', error);
      return [];
    }
  }

  // Limpiar visitas sincronizadas
  async clearSyncedVisits() {
    try {
      await localforage.setItem('offline-visits', []);
    } catch (error) {
      console.error('Error clearing visits:', error);
    }
  }

  // Guardar usuario
  async saveUser(user) {
    try {
      await localforage.setItem('user', user);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  // Obtener usuario
  async getUser() {
    try {
      return await localforage.getItem('user');
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Limpiar todo
  async clear() {
    try {
      await localforage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export default new StorageService();