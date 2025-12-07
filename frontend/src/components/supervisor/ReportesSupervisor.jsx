import React, { useState, useEffect } from 'react';
import { reportesAPI } from '../../services/adminAPI';
import api from '../../services/api';
import '../admin/AdminPanel.css';

const ReportesSupervisor = ({ servicioId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtros
  const [tipoReporte, setTipoReporte] = useState('visitas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [puntoQrId, setPuntoQrId] = useState('');

  // Datos
  const [puntosQr, setPuntosQr] = useState([]);
  const [reporteData, setReporteData] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
    // Establecer fecha de hace 7 días por defecto
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    setFechaInicio(hace7Dias.toISOString().split('T')[0]);
    setFechaFin(new Date().toISOString().split('T')[0]);
  }, [servicioId]);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar puntos QR del servicio (el backend ya filtra por servicio_id del supervisor)
      const puntosData = await api.getPuntos(servicioId);
      setPuntosQr(puntosData);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar datos iniciales');
    }
  };

  const generarReporte = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio + 'T00:00:00Z');
      if (fechaFin) params.append('fecha_fin', fechaFin + 'T23:59:59Z');
      params.append('servicio_id', servicioId); // Siempre filtrar por servicio del supervisor
      if (puntoQrId) params.append('punto_qr_id', puntoQrId);

      let data;
      if (tipoReporte === 'visitas') {
        data = await reportesAPI.getReporteVisitas(params.toString());
      } else if (tipoReporte === 'ranking') {
        data = await reportesAPI.getRankingPuntos(params.toString());
      } else if (tipoReporte === 'alertas') {
        data = await reportesAPI.getReporteAlertas(params.toString());
      }

      setReporteData(data);
      setSuccess('Reporte generado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio + 'T00:00:00Z');
      if (fechaFin) params.append('fecha_fin', fechaFin + 'T23:59:59Z');
      params.append('servicio_id', servicioId);
      params.append('tipo', tipoReporte);
      params.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

      const blob = await reportesAPI.exportarExcel(params.toString());
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Excel exportado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al exportar Excel');
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio + 'T00:00:00Z');
      if (fechaFin) params.append('fecha_fin', fechaFin + 'T23:59:59Z');
      params.append('servicio_id', servicioId);
      params.append('tipo', tipoReporte);
      params.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

      const blob = await reportesAPI.exportarPDF(params.toString());
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('PDF exportado exitosamente');
    } catch (err) {
      setError(err.message || 'Error al exportar PDF');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setPuntoQrId('');
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    setFechaInicio(hace7Dias.toISOString().split('T')[0]);
    setFechaFin(new Date().toISOString().split('T')[0]);
    setReporteData(null);
  };

  const formatearFechaHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const fechaStr = fecha.toLocaleDateString('es-MX');
    const horaStr = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    return { fecha: fechaStr, hora: horaStr };
  };

  return (
    <div className="reportes-admin">
      <h2>📊 Reportes de Mi Servicio</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filtros */}
      <div className="card">
        <h3>Filtros de Reporte</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de Reporte</label>
            <select 
              value={tipoReporte} 
              onChange={(e) => setTipoReporte(e.target.value)}
              className="form-control"
            >
              <option value="visitas">Visitas</option>
              <option value="ranking">Ranking de Puntos</option>
              <option value="alertas">Alertas</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="form-control"
            />
          </div>

          {tipoReporte === 'visitas' && (
            <div className="form-group">
              <label>Punto QR (opcional)</label>
              <select
                value={puntoQrId}
                onChange={(e) => setPuntoQrId(e.target.value)}
                className="form-control"
              >
                <option value="">Todos los puntos</option>
                {puntosQr.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="button-group">
          <button 
            onClick={generarReporte} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Generando...' : '📊 Ver Reporte'}
          </button>
          <button 
            onClick={exportarExcel} 
            disabled={loading}
            className="btn btn-success"
          >
            📑 Exportar Excel
          </button>
          <button 
            onClick={exportarPDF} 
            disabled={loading}
            className="btn btn-danger"
          >
            📄 Exportar PDF
          </button>
          <button 
            onClick={limpiarFiltros}
            className="btn btn-secondary"
          >
            🔄 Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Resultados */}
      {reporteData && (
        <div className="card">
          <h3>Resultados del Reporte</h3>

          {/* Estadísticas */}
          {reporteData.estadisticas && (
            <div className="stats-grid">
              {tipoReporte === 'visitas' && (
                <>
                  <div className="stat-card">
                    <div className="stat-value">{reporteData.estadisticas.total_visitas}</div>
                    <div className="stat-label">Total Visitas</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reporteData.estadisticas.usuarios_unicos}</div>
                    <div className="stat-label">Guardias Activos</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reporteData.estadisticas.puntos_visitados}</div>
                    <div className="stat-label">Puntos Visitados</div>
                  </div>
                </>
              )}

              {tipoReporte === 'alertas' && (
                <>
                  <div className="stat-card">
                    <div className="stat-value">{reporteData.estadisticas.total_alertas}</div>
                    <div className="stat-label">Total Alertas</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reporteData.estadisticas.alertas_leidas}</div>
                    <div className="stat-label">Alertas Leídas</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{reporteData.estadisticas.alertas_pendientes}</div>
                    <div className="stat-label">Alertas Pendientes</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tabla de Visitas */}
          {tipoReporte === 'visitas' && reporteData.visitas && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Punto Visitado</th>
                    <th>Guardia</th>
                    <th>Estatus</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.visitas.slice(0, 100).map((visita, idx) => {
                    const { fecha, hora } = formatearFechaHora(visita.created_at);
                    return (
                      <tr key={idx}>
                        <td>{fecha}</td>
                        <td>{hora}</td>
                        <td>{visita.punto_nombre || 'Desconocido'}</td>
                        <td>{visita.usuario_nombre || 'Desconocido'}</td>
                        <td>
                          <span className="badge badge-success">✓ Visitado</span>
                        </td>
                        <td>{visita.observacion || visita.observaciones || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {reporteData.visitas.length > 100 && (
                <p className="table-note">
                  Mostrando 100 de {reporteData.visitas.length} visitas. 
                  Exporta a Excel o PDF para ver todos los resultados.
                </p>
              )}
            </div>
          )}

          {/* Tabla de Ranking */}
          {tipoReporte === 'ranking' && reporteData.ranking && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Punto QR</th>
                    <th>Código</th>
                    <th>Total Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.ranking.map((punto, idx) => (
                    <tr key={idx}>
                      <td><strong>{idx + 1}</strong></td>
                      <td>{punto.nombre}</td>
                      <td><code>{punto.codigo}</code></td>
                      <td>
                        <span className="badge badge-primary">
                          {punto.total_visitas}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabla de Alertas */}
          {tipoReporte === 'alertas' && reporteData.alertas && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Tipo</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteData.alertas.slice(0, 50).map((alerta, idx) => (
                    <tr key={idx}>
                      <td>{new Date(alerta.created_at).toLocaleString('es-MX')}</td>
                      <td>
                        <span className={`badge badge-${alerta.tipo === 'info' ? 'info' : 'warning'}`}>
                          {alerta.tipo}
                        </span>
                      </td>
                      <td>{alerta.mensaje}</td>
                      <td>
                        {alerta.leido ? (
                          <span className="badge badge-success">✓ Leída</span>
                        ) : (
                          <span className="badge badge-warning">• Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reporteData.alertas.length > 50 && (
                <p className="table-note">
                  Mostrando 50 de {reporteData.alertas.length} alertas.
                  Exporta a Excel o PDF para ver todos los resultados.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estilos */}
      <style>{`
        .reportes-admin {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.9em;
          opacity: 0.9;
        }

        .table-note {
          text-align: center;
          color: #666;
          font-style: italic;
          margin-top: 10px;
        }

        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-success {
          background: #28a745;
        }

        .btn-danger {
          background: #dc3545;
        }

        .btn-secondary {
          background: #6c757d;
        }

        code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85em;
          font-weight: 500;
        }

        .badge-success {
          background: #28a745;
          color: white;
        }

        .badge-warning {
          background: #ffc107;
          color: #000;
        }

        .badge-info {
          background: #17a2b8;
          color: white;
        }

        .badge-primary {
          background: #007bff;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ReportesSupervisor;