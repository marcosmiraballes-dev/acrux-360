import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { puntosAdminAPI, serviciosAPI } from '../../services/adminAPI';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para seleccionar ubicación en el mapa
const LocationSelector = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const PuntosAdmin = ({ onUpdate }) => {
  const [puntos, setPuntos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPunto, setEditingPunto] = useState(null);
  const [filtros, setFiltros] = useState({ servicio_id: '' });
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    latitud: -31.4201,  // San Luis por defecto
    longitud: -64.1888,
    servicio_id: '',
    radio_validacion: 50,
    activo: true
  });

  const [mapPosition, setMapPosition] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [puntosData, serviciosData] = await Promise.all([
        puntosAdminAPI.listar(filtros),
        serviciosAPI.listar({ activo: true })
      ]);
      setPuntos(puntosData);
      setServicios(serviciosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingPunto) {
        await puntosAdminAPI.actualizar(editingPunto.id, formData);
        alert('Punto QR actualizado correctamente');
      } else {
        const nuevoPunto = await puntosAdminAPI.crear(formData);
        alert(`Punto QR creado. Código: ${nuevoPunto.codigo_qr}`);
      }
      
      resetForm();
      cargarDatos();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error guardando punto:', error);
      alert(error.response?.data?.detail || 'Error al guardar punto QR');
    }
  };

  const handleEdit = (punto) => {
    setEditingPunto(punto);
    setFormData({
      nombre: punto.nombre,
      descripcion: punto.descripcion || '',
      latitud: punto.latitud,
      longitud: punto.longitud,
      servicio_id: punto.servicio_id,
      radio_validacion: punto.radio_validacion,
      activo: punto.activo
    });
    setMapPosition([punto.latitud, punto.longitud]);
    setShowForm(true);
  };

  const handleDelete = async (punto) => {
    if (!confirm(`¿Eliminar el punto "${punto.nombre}"?`)) return;
    
    try {
      await puntosAdminAPI.eliminar(punto.id);
      alert('Punto QR eliminado correctamente');
      cargarDatos();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error eliminando punto:', error);
      alert(error.response?.data?.detail || 'Error al eliminar punto');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      latitud: -31.4201,
      longitud: -64.1888,
      servicio_id: '',
      radio_validacion: 50,
      activo: true
    });
    setEditingPunto(null);
    setShowForm(false);
    setMapPosition(null);
    setShowMap(false);
  };

  const handleMapSelect = () => {
    if (mapPosition) {
      setFormData({
        ...formData,
        latitud: mapPosition[0],
        longitud: mapPosition[1]
      });
      setShowMap(false);
    }
  };

  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData({ ...formData, latitud: lat, longitud: lng });
          setMapPosition([lat, lng]);
          alert('Ubicación actual obtenida');
        },
        (error) => {
          alert('Error obteniendo ubicación: ' + error.message);
        }
      );
    } else {
      alert('Geolocalización no soportada por el navegador');
    }
  };

  return (
    <div className="puntos-admin">
      <div className="admin-section-header">
        <h2>Gestión de Puntos QR</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Cancelar' : '➕ Nuevo Punto QR'}
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros">
        <select 
          value={filtros.servicio_id}
          onChange={(e) => setFiltros({ ...filtros, servicio_id: e.target.value })}
        >
          <option value="">Todos los servicios</option>
          {servicios.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {/* Formulario */}
      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h3>{editingPunto ? 'Editar Punto QR' : 'Nuevo Punto QR'}</h3>
          
          <div className="form-group">
            <label>Nombre del Punto *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Entrada Principal"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción del punto (opcional)"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Servicio *</label>
            <select
              required
              value={formData.servicio_id}
              onChange={(e) => setFormData({ ...formData, servicio_id: parseInt(e.target.value) })}
            >
              <option value="">Seleccionar servicio</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ubicación GPS *</label>
            <div className="ubicacion-controls">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setMapPosition([formData.latitud, formData.longitud]);
                  setShowMap(!showMap);
                }}
              >
                🗺️ {showMap ? 'Ocultar' : 'Seleccionar en'} Mapa
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={obtenerUbicacionActual}
              >
                📍 Usar Ubicación Actual
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Latitud</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.latitud}
                  onChange={(e) => setFormData({ ...formData, latitud: parseFloat(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Longitud</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.longitud}
                  onChange={(e) => setFormData({ ...formData, longitud: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            {showMap && (
              <div className="map-selector">
                <MapContainer 
                  center={mapPosition || [formData.latitud, formData.longitud]} 
                  zoom={15} 
                  style={{ height: '300px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <LocationSelector position={mapPosition} setPosition={setMapPosition} />
                </MapContainer>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleMapSelect}
                  style={{ marginTop: '10px' }}
                >
                  ✅ Usar Ubicación Seleccionada
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Radio de Validación (metros) *</label>
            <input
              type="number"
              required
              min="10"
              max="500"
              value={formData.radio_validacion}
              onChange={(e) => setFormData({ 
                ...formData, 
                radio_validacion: parseInt(e.target.value) 
              })}
            />
            <small>Entre 10 y 500 metros</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              Punto activo
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingPunto ? '💾 Actualizar' : '➕ Crear'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabla de puntos */}
      {loading ? (
        <p>Cargando puntos QR...</p>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código QR</th>
                <th>Nombre</th>
                <th>Servicio</th>
                <th>Ubicación</th>
                <th>Radio (m)</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((punto) => (
                <tr key={punto.id}>
                  <td><code>{punto.codigo_qr}</code></td>
                  <td>{punto.nombre}</td>
                  <td>{punto.servicio_nombre || '-'}</td>
                  <td>
                    <small>
                      {punto.latitud.toFixed(6)}, {punto.longitud.toFixed(6)}
                    </small>
                  </td>
                  <td>{punto.radio_validacion}</td>
                  <td>
                    <span className={`status-badge ${punto.activo ? 'activo' : 'inactivo'}`}>
                      {punto.activo ? '✅' : '❌'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button 
                      className="btn-icon edit"
                      onClick={() => handleEdit(punto)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon delete"
                      onClick={() => handleDelete(punto)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {puntos.length === 0 && (
            <p className="no-data">No hay puntos QR creados</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PuntosAdmin;