import React, { useState, useEffect } from 'react';
import { usuariosAPI } from '../../services/adminAPI';

const UsuariosAdmin = ({ onUpdate }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filtros, setFiltros] = useState({ activo: null, rol: '' });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    rol: 'guardia',
    telefono: '',
    activo: true
  });

  useEffect(() => {
    cargarUsuarios();
  }, [filtros]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosAPI.listar(filtros);
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Actualizar
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // No enviar si está vacío
        await usuariosAPI.actualizar(editingUser.id, updateData);
        alert('Usuario actualizado correctamente');
      } else {
        // Crear
        await usuariosAPI.crear(formData);
        alert('Usuario creado correctamente');
      }
      
      resetForm();
      cargarUsuarios();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert(error.response?.data?.detail || 'Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.email,
      password: '', // Vacío para no cambiar
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      telefono: usuario.telefono || '',
      activo: usuario.activo
    });
    setShowForm(true);
  };

  const handleDelete = async (usuario) => {
    if (!confirm(`¿Eliminar al usuario ${usuario.nombre} ${usuario.apellido}?`)) return;
    
    try {
      await usuariosAPI.eliminar(usuario.id);
      alert('Usuario eliminado correctamente');
      cargarUsuarios();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert(error.response?.data?.detail || 'Error al eliminar usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      rol: 'guardia',
      telefono: '',
      activo: true
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const getRolBadge = (rol) => {
    const badges = {
      admin: { emoji: '⚙️', class: 'rol-admin' },
      supervisor: { emoji: '👁️', class: 'rol-supervisor' },
      guardia: { emoji: '👮', class: 'rol-guardia' }
    };
    const badge = badges[rol] || badges.guardia;
    return <span className={`rol-badge ${badge.class}`}>{badge.emoji} {rol}</span>;
  };

  return (
    <div className="usuarios-admin">
      <div className="admin-section-header">
        <h2>Gestión de Usuarios</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '❌ Cancelar' : '➕ Nuevo Usuario'}
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros">
        <select 
          value={filtros.activo === null ? '' : filtros.activo}
          onChange={(e) => setFiltros({
            ...filtros, 
            activo: e.target.value === '' ? null : e.target.value === 'true'
          })}
        >
          <option value="">Todos los estados</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>

        <select 
          value={filtros.rol}
          onChange={(e) => setFiltros({ ...filtros, rol: e.target.value })}
        >
          <option value="">Todos los roles</option>
          <option value="guardia">Guardias</option>
          <option value="supervisor">Supervisores</option>
          <option value="admin">Administradores</option>
        </select>
      </div>

      {/* Formulario */}
      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}</label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Dejar vacío para mantener' : ''}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Apellido *</label>
              <input
                type="text"
                required
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rol *</label>
              <select
                required
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              >
                <option value="guardia">Guardia</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              Usuario activo
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingUser ? '💾 Actualizar' : '➕ Crear'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabla de usuarios */}
      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nombre} {usuario.apellido}</td>
                  <td>{usuario.email}</td>
                  <td>{getRolBadge(usuario.rol)}</td>
                  <td>{usuario.telefono || '-'}</td>
                  <td>
                    <span className={`status-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                      {usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button 
                      className="btn-icon edit"
                      onClick={() => handleEdit(usuario)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon delete"
                      onClick={() => handleDelete(usuario)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuarios.length === 0 && (
            <p className="no-data">No se encontraron usuarios</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;