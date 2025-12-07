import React, { useState, useEffect } from 'react';
import { serviciosAPI } from '../../services/adminAPI';

const ServiciosAdmin = ({ onUpdate }) => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingServicio, setEditingServicio] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    hora_inicio: '08:00',
    hora_fin: '20:00',
    dias_activo: [0, 1, 2, 3, 4], // Lunes a Viernes por defecto
    intervalo_ronda_minutos: 60,
    activo: true
  });

  const diasSemana = [
    { id: 0, nombre: 'Lun' },
    { id: 1, nombre: 'Mar' },
    { id: 2, nombre: 'Mié' },
    { id: 3, nombre: 'Jue' },
    { id: 4, nombre: 'Vie' },
    { id: 5, nombre: 'Sáb' },
    { id: 6, nombre: 'Dom' }
  ];

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const data = await serviciosAPI.listar();
      setServicios(data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      alert('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.dias_activo.length === 0) {
      alert('Debe seleccionar al menos un día');
      return;
    }

    try {
      if (editingServicio) {
        await serviciosAPI.actualizar(editingServicio.id, formData);
        alert('Servicio actualizado correctamente');
      } else {
        await serviciosAPI.crear(formData);
        alert('Servicio creado correctamente');
      }
      
      resetForm();
      cargarServicios();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error guardando servicio:', error);
      alert(error.response?.data?.detail || 'Error al guardar servicio');
    }
  };

  const handleEdit = (servicio) => {
    setEditingServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      hora_inicio: servicio.hora_inicio,
      hora_fin: servicio.hora_fin,
      dias_activo: servicio.dias_activo,
      intervalo_ronda_minutos: servicio.intervalo_ronda_minutos,
      activo: servicio.activo
    });
    setShowForm(true);
  };

  const handleDelete = async (servicio) => {
    if (!confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) return;
    
    try {
      await serviciosAPI.eliminar(servicio.id);
      alert('Servicio eliminado correctamente');
      cargarServicios();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      alert(error.response?.data?.detail || 'Error al eliminar servicio');
    }
  };

  const handleReactivar = async (servicio) => {
    if (!confirm(`¿Reactivar el servicio "${servicio.nombre}"?`)) return;
    
    try {
      await serviciosAPI.reactivar(servicio.id);
      alert('Servicio reactivado correctamente');
      cargarServicios();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error reactivando servicio:', error);
      alert(error.response?.data?.detail || 'Error al reactivar servicio');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      hora_inicio: '08:00',
      hora_fin: '20:00',
      dias_activo: [0, 1, 2, 3, 4],
      intervalo_ronda_minutos: 60,
      activo: true
    });
    setEditingServicio(null);
    setShowForm(false);
  };

  const toggleDia = (diaId) => {
    const newDias = formData.dias_activo.includes(diaId)
      ? formData.dias_activo.filter(d => d !== diaId)
      : [...formData.dias_activo, diaId].sort();
    
    setFormData({ ...formData, dias_activo: newDias });
  };

  const getDiasTexto = (dias) => {
    if (dias.length === 7) return 'Todos los días';
    if (dias.length === 0) return 'Ningún día';
    return dias.map(d => diasSemana[d].nombre).join(', ');
  };

  return (
    <div className="servicios-admin">
      <div className="admin-section-header">
        <h2>Gestión de Servicios</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Cancelar' : '➕ Nuevo Servicio'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h3>{editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
          
          <div className="form-group">
            <label>Nombre del Servicio *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Ronda Nocturna"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción del servicio (opcional)"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hora Inicio *</label>
              <input
                type="time"
                required
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Hora Fin *</label>
              <input
                type="time"
                required
                value={formData.hora_fin}
                onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Intervalo de Ronda (minutos) *</label>
            <input
              type="number"
              required
              min="5"
              value={formData.intervalo_ronda_minutos}
              onChange={(e) => setFormData({ 
                ...formData, 
                intervalo_ronda_minutos: parseInt(e.target.value) 
              })}
            />
            <small>Tiempo entre cada ronda (mínimo 5 minutos)</small>
          </div>

          <div className="form-group">
            <label>Días Activos *</label>
            <div className="dias-selector">
              {diasSemana.map(dia => (
                <button
                  key={dia.id}
                  type="button"
                  className={`dia-btn ${formData.dias_activo.includes(dia.id) ? 'selected' : ''}`}
                  onClick={() => toggleDia(dia.id)}
                >
                  {dia.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              Servicio activo
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingServicio ? '💾 Actualizar' : '➕ Crear'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de servicios */}
      {loading ? (
        <p>Cargando servicios...</p>
      ) : (
        <div className="servicios-grid">
          {servicios.map((servicio) => (
            <div key={servicio.id} className={`servicio-card ${!servicio.activo ? 'inactivo' : ''}`}>
              <div className="servicio-header">
                <h3>{servicio.nombre}</h3>
                <span className={`status-badge ${servicio.activo ? 'activo' : 'inactivo'}`}>
                  {servicio.activo ? '✅' : '❌'}
                </span>
              </div>

              {servicio.descripcion && (
                <p className="servicio-descripcion">{servicio.descripcion}</p>
              )}

              <div className="servicio-info">
                <div className="info-item">
                  <span className="info-label">🕐 Horario:</span>
                  <span>{servicio.hora_inicio} - {servicio.hora_fin}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">📅 Días:</span>
                  <span>{getDiasTexto(servicio.dias_activo)}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">⏱️ Intervalo:</span>
                  <span>{servicio.intervalo_ronda_minutos} minutos</span>
                </div>
              </div>

              <div className="servicio-actions">
                <button 
                  className="btn-icon edit"
                  onClick={() => handleEdit(servicio)}
                  title="Editar"
                >
                  ✏️ Editar
                </button>
                {servicio.activo ? (
                  <button 
                    className="btn-icon delete"
                    onClick={() => handleDelete(servicio)}
                    title="Eliminar"
                  >
                    🗑️ Eliminar
                  </button>
                ) : (
                  <button 
                    className="btn-icon reactivar"
                    onClick={() => handleReactivar(servicio)}
                    title="Reactivar"
                    style={{ background: '#4caf50' }}
                  >
                    ✓ Reactivar
                  </button>
                )}
              </div>
            </div>
          ))}

          {servicios.length === 0 && (
            <p className="no-data">No hay servicios creados</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiciosAdmin;