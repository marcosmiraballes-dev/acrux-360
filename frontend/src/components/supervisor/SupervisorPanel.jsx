import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import MapView from './MapView';
import GuardiasList from './GuardiasList';
import RecentVisits from './RecentVisits';
import Alertas from './Alertas';  // <-- NUEVO
import api from '../../services/api';

function SupervisorPanel({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [visitas, setVisitas] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertasCount, setAlertasCount] = useState(0);  // <-- NUEVO

  useEffect(() => {
    loadData();
    loadAlertasCount();  // <-- NUEVO
    // Recargar cada minuto
    const interval = setInterval(() => {
      loadData();
      loadAlertasCount();  // <-- NUEVO
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const visitasData = await api.getVisits(user.servicio_id);
      setVisitas(visitasData);

      const puntosData = await api.getPuntos(user.servicio_id);
      setPuntos(puntosData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // <-- NUEVO
  const loadAlertasCount = async () => {
    try {
      const countData = await api.getAlertasCount(user.servicio_id);
      setAlertasCount(countData.total);
    } catch (error) {
      console.error('Error loading alertas count:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        fontSize: '24px'
      }}>
        ⏳ Cargando panel de supervisor...
      </div>
    );
  }

  return (
    <div>
      {/* Pestañas */}
      <div style={{
        background: 'white',
        borderBottom: '2px solid #e0e0e0',
        display: 'flex',
        gap: '5px',
        padding: '0 20px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'mapa', label: '🗺️ Mapa' },
          { id: 'guardias', label: '👥 Guardias' },
          { id: 'alertas', label: '🔔 Alertas', badge: alertasCount },  // <-- NUEVO
          { id: 'recientes', label: '🕐 Recientes' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 25px',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1976d2' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #1976d2' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              fontSize: '16px',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              position: 'relative'
            }}
          >
            {tab.label}
            {/* Badge de contador */}
            {tab.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#f44336',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {activeTab === 'dashboard' && <Dashboard servicioId={user.servicio_id} />}
        {activeTab === 'mapa' && <MapView puntos={puntos} visitas={visitas} />}
        {activeTab === 'guardias' && <GuardiasList servicioId={user.servicio_id} visitas={visitas} />}
        {activeTab === 'alertas' && <Alertas servicioId={user.servicio_id} />}  {/* <-- NUEVO */}
        {activeTab === 'recientes' && <RecentVisits visitas={visitas} />}
      </div>
    </div>
  );
}

export default SupervisorPanel;