import { useState, useEffect } from 'react';
import api from '../services/api';
import storage from '../services/storage';

function VisitList({ user }) {
  const [visits, setVisits] = useState([]);
  const [offlineVisits, setOfflineVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      // Cargar visitas online
      const onlineVisits = await api.getVisits();
      setVisits(onlineVisits);

      // Cargar visitas offline
      const offline = await storage.getOfflineVisits();
      setOfflineVisits(offline);
    } catch (error) {
      console.error('Error loading visits:', error);
      // Si falla, solo cargar offline
      const offline = await storage.getOfflineVisits();
      setOfflineVisits(offline);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'normal': return '#4caf50';
      case 'observacion': return '#ff9800';
      case 'incidencia': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Cargando visitas...</div>;
  }

  const allVisits = [...visits, ...offlineVisits];

  if (allVisits.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#757575' }}>
        <p style={{ fontSize: '48px' }}>📋</p>
        <p>No hay visitas registradas</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>📋 Historial de Visitas</h2>

      {offlineVisits.length > 0 && (
        <div style={{
          background: '#fff3cd',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#856404'
        }}>
          ⚠️ Tienes {offlineVisits.length} visita(s) pendiente(s) de sincronizar
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {allVisits.map((visit, index) => (
          <div
            key={visit.id || index}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span
                style={{
                  background: getTipoColor(visit.tipo),
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {visit.tipo.toUpperCase()}
              </span>
              
              {!visit.sincronizado && (
                <span
                  style={{
                    background: '#ff9800',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '14px'
                  }}
                >
                  📴 OFFLINE
                </span>
              )}
            </div>

            <p style={{ margin: '5px 0' }}>
              <strong>📅 Fecha:</strong> {formatDate(visit.fecha_hora)}
            </p>
            
            {visit.observacion && (
              <p style={{ margin: '5px 0' }}>
                <strong>📝 Observación:</strong> {visit.observacion}
              </p>
            )}

            <p style={{ margin: '5px 0', fontSize: '12px', color: '#757575' }}>
              📍 GPS: {visit.latitud.toFixed(6)}, {visit.longitud.toFixed(6)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VisitList;