import { useState, useEffect } from 'react';
import api from '../../services/api';

function GuardiasList({ servicioId, visitas }) {
  const [guardias, setGuardias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuardias();
  }, [servicioId]);

  const loadGuardias = async () => {
    try {
      setLoading(true);
      // Obtener guardias del servicio desde el backend
      const guardiasData = await api.getGuardias(servicioId);
      
      // Agregar estadísticas de visitas a cada guardia
      const guardiasConEstadisticas = guardiasData.map(guardia => {
        const visitasGuardia = visitas.filter(v => v.guardia_id === guardia.id);
        
        const sortedVisits = visitasGuardia.sort((a, b) => 
          new Date(b.fecha_hora) - new Date(a.fecha_hora)
        );
        
        const lastVisit = sortedVisits[0];
        const today = new Date().toDateString();
        const todayVisits = visitasGuardia.filter(v => 
          new Date(v.fecha_hora).toDateString() === today
        ).length;

        return {
          ...guardia,
          totalVisitas: visitasGuardia.length,
          visitasHoy: todayVisits,
          ultimaVisita: lastVisit?.fecha_hora,
          ultimoPunto: lastVisit?.punto_qr_id,
          activo: lastVisit ? isActive(lastVisit.fecha_hora) : false
        };
      });

      setGuardias(guardiasConEstadisticas);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando guardias:', error);
      setLoading(false);
    }
  };

  const isActive = (lastVisitDate) => {
    const now = new Date();
    const lastVisit = new Date(lastVisitDate);
    const diffMinutes = (now - lastVisit) / (1000 * 60);
    return diffMinutes < 120; // Activo si visitó en las últimas 2 horas
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>⏳ Cargando guardias...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 Guardias del Servicio</h2>

      {guardias.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: 'white',
          borderRadius: '8px',
          color: '#757575'
        }}>
          <p style={{ fontSize: '48px' }}>👤</p>
          <p>No hay guardias asignados a este servicio</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '15px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
        }}>
          {guardias.map((guardia) => (
            <div
              key={guardia.id}
              style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'relative'
              }}
            >
              {/* Indicador de estado */}
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: guardia.activo ? '#4caf50' : '#9e9e9e',
                boxShadow: guardia.activo ? '0 0 8px #4caf50' : 'none'
              }}></div>

              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>
                  👤 {guardia.nombre}
                </h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>
                  {guardia.email}
                </p>
                <span style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: guardia.activo ? '#c8e6c9' : '#e0e0e0',
                  color: guardia.activo ? '#2e7d32' : '#757575'
                }}>
                  {guardia.activo ? '✓ Activo' : '○ Inactivo'}
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ 
                  background: '#e3f2fd', 
                  padding: '10px', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                    {guardia.visitasHoy}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Hoy</div>
                </div>
                <div style={{ 
                  background: '#f3e5f5', 
                  padding: '10px', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
                    {guardia.totalVisitas}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
                </div>
              </div>

              {guardia.ultimaVisita && (
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>🕐 Última visita:</strong><br/>
                    {new Date(guardia.ultimaVisita).toLocaleString('es-MX')}
                  </p>
                </div>
              )}

              {guardia.telefono && (
                <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                  <strong>📞</strong> {guardia.telefono}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GuardiasList;