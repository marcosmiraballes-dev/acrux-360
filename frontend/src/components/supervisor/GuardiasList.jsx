import { useState, useEffect } from 'react';

function GuardiasList({ servicioId, visitas }) {
  const [guardias, setGuardias] = useState([]);

  useEffect(() => {
    if (visitas && visitas.length > 0) {
      // Extraer guardias únicos de las visitas
      const guardiasMap = new Map();
      
      visitas.forEach(visita => {
        if (!guardiasMap.has(visita.guardia_id)) {
          guardiasMap.set(visita.guardia_id, {
            id: visita.guardia_id,
            visitas: []
          });
        }
        guardiasMap.get(visita.guardia_id).visitas.push(visita);
      });

      // Convertir a array y agregar estadísticas
      const guardiasData = Array.from(guardiasMap.values()).map(guardia => {
        const sortedVisits = guardia.visitas.sort((a, b) => 
          new Date(b.fecha_hora) - new Date(a.fecha_hora)
        );
        
        const lastVisit = sortedVisits[0];
        const today = new Date().toDateString();
        const todayVisits = guardia.visitas.filter(v => 
          new Date(v.fecha_hora).toDateString() === today
        ).length;

        return {
          id: guardia.id,
          totalVisitas: guardia.visitas.length,
          visitasHoy: todayVisits,
          ultimaVisita: lastVisit.fecha_hora,
          ultimoPunto: lastVisit.punto_qr_id,
          activo: isActive(lastVisit.fecha_hora)
        };
      });

      setGuardias(guardiasData);
    }
  }, [visitas]);

  const isActive = (lastVisitDate) => {
    const now = new Date();
    const lastVisit = new Date(lastVisitDate);
    const diffMinutes = (now - lastVisit) / (1000 * 60);
    return diffMinutes < 120; // Activo si visitó en las últimas 2 horas
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 Guardias Activos</h2>

      {guardias.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: 'white',
          borderRadius: '8px',
          color: '#757575'
        }}>
          <p style={{ fontSize: '48px' }}>👤</p>
          <p>No hay guardias registrados</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gap: '15px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
        }}>
          {guardias.map((guardia, index) => (
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
                  👤 Guardia #{index + 1}
                </h3>
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

              <div style={{ fontSize: '13px', color: '#666' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>🕐 Última visita:</strong><br/>
                  {new Date(guardia.ultimaVisita).toLocaleString('es-MX')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GuardiasList;