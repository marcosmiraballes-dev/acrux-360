import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import MapView from './MapView';
import GuardiasList from './GuardiasList';
import RecentVisits from './RecentVisits';
import api from '../../services/api';

function SupervisorPanel({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [visitas, setVisitas] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Recargar cada minuto
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Cargar visitas
      const visitasData = await api.getVisits(user.servicio_id);
      setVisitas(visitasData);

      // Cargar puntos QR (necesitamos crear este endpoint)
      // Por ahora usamos datos mock
      setPuntos([
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          nombre: 'Entrada Principal',
          descripcion: 'Punto de control en entrada',
          latitud: 20.6296,
          longitud: -87.0739
        },
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          nombre: 'Piso 2 - Pasillo A',
          descripcion: 'Control pasillo norte',
          latitud: 20.6297,
          longitud: -87.0740
        },
        {
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          nombre: 'Estacionamiento',
          descripcion: 'Control área de estacionamiento',
          latitud: 20.6298,
          longitud: -87.0741
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
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
          { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
          { id: 'mapa', label: '🗺️ Mapa', icon: '🗺️' },
          { id: 'guardias', label: '👥 Guardias', icon: '👥' },
          { id: 'recientes', label: '🕐 Recientes', icon: '🕐' }
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
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {activeTab === 'dashboard' && <Dashboard servicioId={user.servicio_id} />}
        {activeTab === 'mapa' && <MapView puntos={puntos} visitas={visitas} />}
        {activeTab === 'guardias' && <GuardiasList servicioId={user.servicio_id} visitas={visitas} />}
        {activeTab === 'recientes' && <RecentVisits visitas={visitas} />}
      </div>
    </div>
  );
}

export default SupervisorPanel;