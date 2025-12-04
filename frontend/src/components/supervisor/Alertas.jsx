import { useState, useEffect } from 'react';
import api from '../../services/api';

function Alertas({ servicioId }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlertas();
    // Recargar cada 30 segundos
    const interval = setInterval(loadAlertas, 30000);
    return () => clearInterval(interval);
  }, [servicioId]);

  const loadAlertas = async () => {
    try {
      const alertasData = await api.getAlertas(servicioId);
      setAlertas(alertasData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading alertas:', error);
      setLoading(false);
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'alta': return { bg: '#ffcdd2', color: '#c62828', border: '#f44336' };
      case 'media': return { bg: '#fff3cd', color: '#856404', border: '#ff9800' };
      case 'baja': return { bg: '#e3f2fd', color: '#1565c0', border: '#2196f3' };
      default: return { bg: '#f5f5f5', color: '#666', border: '#ccc' };
    }
  };

  const getPrioridadIcon = (prioridad) => {
    switch (prioridad) {
      case 'alta': return '🚨';
      case 'media': return '⚠️';
      case 'baja': return 'ℹ️';
      default: return '○';
    }
  };

  const formatTiempo = (minutos) => {
    if (minutos === null) return 'Nunca visitado';
    if (minutos < 60) return `${minutos} minutos`;
    if (minutos < 1440) return `${Math.floor(minutos / 60)} horas`;
    return `${Math.floor(minutos / 1440)} días`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Cargando alertas...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>🔔 Alertas del Sistema</h2>
        <button
          onClick={loadAlertas}
          style={{
            padding: '8px 16px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Resumen de alertas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {alertas.filter(a => a.prioridad === 'alta').length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Prioridad Alta</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {alertas.filter(a => a.prioridad === 'media').length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Prioridad Media</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #2196f3 0%, #03a9f4 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {alertas.filter(a => a.prioridad === 'baja').length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Prioridad Baja</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
            {alertas.length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total de Alertas</div>
        </div>
      </div>

      {/* Lista de alertas */}
      {alertas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '8px',
          color: '#4caf50'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h3 style={{ margin: '0 0 10px 0' }}>¡Todo en orden!</h3>
          <p style={{ margin: 0, color: '#666' }}>No hay alertas activas en este momento</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {alertas.map((alerta) => {
            const colors = getPrioridadColor(alerta.prioridad);
            
            return (
              <div
                key={alerta.punto_id}
                style={{
                  background: 'white',
                  border: `2px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                {/* Icono de prioridad */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.bg,
                  color: colors.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  flexShrink: 0
                }}>
                  {getPrioridadIcon(alerta.prioridad)}
                </div>

                {/* Información */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>
                      📍 {alerta.punto_nombre}
                    </h3>
                    <span style={{
                      background: colors.bg,
                      color: colors.color,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: `1px solid ${colors.border}`
                    }}>
                      {alerta.prioridad.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {alerta.ultima_visita ? (
                      <>
                        <strong>⏰ Última visita:</strong> hace {formatTiempo(alerta.minutos_sin_visitar)}
                        <br/>
                        <strong>📅 Fecha:</strong> {new Date(alerta.ultima_visita).toLocaleString('es-MX')}
                      </>
                    ) : (
                      <strong style={{ color: '#f44336' }}>⚠️ Este punto nunca ha sido visitado</strong>
                    )}
                  </div>
                </div>

                {/* Flecha */}
                <div style={{ fontSize: '24px', color: '#ccc' }}>›</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Alertas;