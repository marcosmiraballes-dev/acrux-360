import api from './api';
import storage from './storage';

class SyncService {
  constructor() {
    this.isSyncing = false;
  }

  // Verificar si hay conexión
  isOnline() {
    return navigator.onLine;
  }

  // Sincronizar visitas pendientes
  async syncPendingVisits() {
    if (this.isSyncing) {
      console.log('Ya hay una sincronización en curso');
      return;
    }

    if (!this.isOnline()) {
      console.log('Sin conexión a internet');
      return;
    }

    this.isSyncing = true;

    try {
      const offlineVisits = await storage.getOfflineVisits();

      if (offlineVisits.length === 0) {
        console.log('No hay visitas pendientes de sincronizar');
        this.isSyncing = false;
        return;
      }

      console.log(`Sincronizando ${offlineVisits.length} visitas...`);

      const result = await api.syncOfflineVisits(offlineVisits);

      console.log('Resultado de sincronización:', result);

      if (result.success && result.success.length > 0) {
        await storage.clearSyncedVisits();
        console.log('Visitas sincronizadas correctamente');
      }

      this.isSyncing = false;
      return result;
    } catch (error) {
      console.error('Error sincronizando visitas:', error);
      this.isSyncing = false;
      throw error;
    }
  }

  // Iniciar sincronización automática
  startAutoSync(intervalMinutes = 5) {
    // Sincronizar cada X minutos
    setInterval(() => {
      this.syncPendingVisits();
    }, intervalMinutes * 60 * 1000);

    // Sincronizar cuando se recupere la conexión
    window.addEventListener('online', () => {
      console.log('Conexión recuperada, sincronizando...');
      this.syncPendingVisits();
    });
  }
}

export default new SyncService();