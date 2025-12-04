import { useState, useEffect } from 'react';
import api from '../../services/api';

function Dashboard({ servicioId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Recargar cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [servicioId]);

  const loadStats = async () => {
    try {
      const visits = await api.getVisits(servicioId);
      
      // Calcular estadísticas
      const today = new Date().toDateString();
      const todayVisits = visits.filter(v => 
        new Date(v.fecha_hora).toDateString() === today
      );
      
      const incidencias = visits.filter(v => v.tipo === 'incidencia').length;
      const observaciones = visits.filter(v => v.tipo === 'observacion').length;
      
      setStats({
        totalVisitsToday: todayVisits.length,
        totalVisits: visits.length,
        incidencias,
        observaciones,
        lastUpdate: new Date().toLocaleTimeString()
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Cargando estadísticas...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>📊 Dashboard</h2>
        <span style={{ fontSize: '14px', color: '#666' }}>
          Última actualización: {stats.lastUpdate}
        </span>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Card 1: Visitas Hoy */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>
            VISITAS HOY
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {stats.totalVisitsToday}
          </div>
        </div>

        {/* Card 2: Total Visitas */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>
            TOTAL VISITAS
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {stats.totalVisits}
          </div>
        </div>

        {/* Card 3: Incidencias */}
        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>
            INCIDENCIAS
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {stats.incidencias}
          </div>
        </div>

        {/* Card 4: Observaciones */}
        <div style={{
          background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
          color: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '10px' }}>
            OBSERVACIONES
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {stats.observaciones}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;