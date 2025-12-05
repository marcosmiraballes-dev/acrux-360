import React, { useState, useEffect } from 'react';
import { usuariosAPI, serviciosAPI, puntosAdminAPI } from '../../services/adminAPI';
import UsuariosAdmin from './UsuariosAdmin';
import ServiciosAdmin from './ServiciosAdmin';
import PuntosAdmin from './PuntosAdmin';
import GeneradorQR from './GeneradorQR';
import ReportesAdmin from './ReportesAdmin';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    usuarios: null,
    servicios: null,
    puntos: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const [usuariosStats, serviciosStats, puntosStats] = await Promise.all([
        usuariosAPI.estadisticas(),
        serviciosAPI.estadisticas(),
        puntosAdminAPI.estadisticas()
      ]);

      setStats({
        usuarios: usuariosStats,
        servicios: serviciosStats,
        puntos: puntosStats
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h2>Panel de Administración</h2>
      
      <div className="stats-grid">
        {/* Usuarios */}
        <div className="stat-card">
          <div className="stat-icon usuarios">👥</div>
          <div className="stat-content">
            <h3>Usuarios</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : stats.usuarios ? (
              <>
                <p className="stat-number">{stats.usuarios.total_activos}</p>
                <div className="stat-details">
                  <span>👮 {stats.usuarios.guardias} Guardias</span>
                  <span>👁️ {stats.usuarios.supervisores} Supervisores</span>
                  <span>⚙️ {stats.usuarios.administradores} Admins</span>
                </div>
              </>
            ) : (
              <p>Error cargando datos</p>
            )}
          </div>
          <button 
            className="stat-action"
            onClick={() => setActiveTab('usuarios')}
          >
            Gestionar →
          </button>
        </div>

        {/* Servicios */}
        <div className="stat-card">
          <div className="stat-icon servicios">📋</div>
          <div className="stat-content">
            <h3>Servicios</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : stats.servicios ? (
              <>
                <p className="stat-number">{stats.servicios.activos}</p>
                <div className="stat-details">
                  <span>✅ {stats.servicios.activos} Activos</span>
                  <span>❌ {stats.servicios.inactivos} Inactivos</span>
                  <span>📊 Total: {stats.servicios.total}</span>
                </div>
              </>
            ) : (
              <p>Error cargando datos</p>
            )}
          </div>
          <button 
            className="stat-action"
            onClick={() => setActiveTab('servicios')}
          >
            Gestionar →
          </button>
        </div>

        {/* Puntos QR */}
        <div className="stat-card">
          <div className="stat-icon puntos">📍</div>
          <div className="stat-content">
            <h3>Puntos QR</h3>
            {loading ? (
              <p>Cargando...</p>
            ) : stats.puntos ? (
              <>
                <p className="stat-number">{stats.puntos.activos}</p>
                <div className="stat-details">
                  <span>✅ {stats.puntos.activos} Activos</span>
                  <span>❌ {stats.puntos.inactivos} Inactivos</span>
                  <span>📊 Total: {stats.puntos.total}</span>
                </div>
              </>
            ) : (
              <p>Error cargando datos</p>
            )}
          </div>
          <button 
            className="stat-action"
            onClick={() => setActiveTab('puntos')}
          >
            Gestionar →
          </button>
        </div>
      </div>

      <div className="admin-info">
        <h3>Acceso Rápido</h3>
        <div className="quick-actions">
          <button onClick={() => setActiveTab('usuarios')} className="quick-btn">
            ➕ Crear Usuario
          </button>
          <button onClick={() => setActiveTab('servicios')} className="quick-btn">
            ➕ Crear Servicio
          </button>
          <button onClick={() => setActiveTab('puntos')} className="quick-btn">
            ➕ Crear Punto QR
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>⚙️ Panel de Administración</h1>
        <div className="admin-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={activeTab === 'usuarios' ? 'active' : ''}
            onClick={() => setActiveTab('usuarios')}
          >
            👥 Usuarios
          </button>
          <button
            className={activeTab === 'servicios' ? 'active' : ''}
            onClick={() => setActiveTab('servicios')}
          >
            📋 Servicios
          </button>
          <button
            className={activeTab === 'puntos' ? 'active' : ''}
            onClick={() => setActiveTab('puntos')}
          >
            📍 Puntos QR
          </button>
          <button
            className={activeTab === 'generador' ? 'active' : ''}
            onClick={() => setActiveTab('generador')}
          >
            📱 Generar QR
          </button>
          <button
            className={activeTab === 'reportes' ? 'active' : ''}
            onClick={() => setActiveTab('reportes')}
          >
            📊 Reportes
          </button>
        </div>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'usuarios' && <UsuariosAdmin onUpdate={cargarEstadisticas} />}
        {activeTab === 'servicios' && <ServiciosAdmin onUpdate={cargarEstadisticas} />}
        {activeTab === 'puntos' && <PuntosAdmin onUpdate={cargarEstadisticas} />}
        {activeTab === 'generador' && <GeneradorQR />}
        {activeTab === 'reportes' && <ReportesAdmin />}
      </div>
    </div>
  );
};

export default AdminPanel;