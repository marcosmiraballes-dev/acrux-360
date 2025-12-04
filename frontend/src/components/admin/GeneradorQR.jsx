import React, { useState, useEffect } from 'react';
import { puntosAdminAPI } from '../../services/adminAPI';

const GeneradorQR = () => {
  const [puntos, setPuntos] = useState([]);
  const [puntosSeleccionados, setPuntosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [previewPunto, setPreviewPunto] = useState(null);
  const [filtroServicio, setFiltroServicio] = useState('');
  const [servicios, setServicios] = useState([]);
  const [previews, setPreviews] = useState({}); // Para almacenar las imágenes base64

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const puntosData = await puntosAdminAPI.listar({ activo: true });
      setPuntos(puntosData);

      // Extraer servicios únicos
      const serviciosUnicos = [...new Set(puntosData.map(p => p.servicio_nombre).filter(Boolean))];
      setServicios(serviciosUnicos);

      // Cargar previews de los QR
      cargarPreviews(puntosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar puntos QR');
    } finally {
      setLoading(false);
    }
  };

  const cargarPreviews = async (puntosData) => {
    const token = localStorage.getItem('token');
    const previewsObj = {};

    for (const punto of puntosData) {
      try {
        const response = await fetch(`http://127.0.0.1:3001/qr-generator/preview/${punto.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          previewsObj[punto.id] = base64;
        }
      } catch (error) {
        console.error(`Error cargando preview de ${punto.nombre}:`, error);
      }
    }

    setPreviews(previewsObj);
  };

  const togglePunto = (puntoId) => {
    if (puntosSeleccionados.includes(puntoId)) {
      setPuntosSeleccionados(puntosSeleccionados.filter(id => id !== puntoId));
    } else {
      setPuntosSeleccionados([...puntosSeleccionados, puntoId]);
    }
  };

  const seleccionarTodos = () => {
    const puntosFiltrados = puntos.filter(p => 
      !filtroServicio || p.servicio_nombre === filtroServicio
    );
    setPuntosSeleccionados(puntosFiltrados.map(p => p.id));
  };

  const deseleccionarTodos = () => {
    setPuntosSeleccionados([]);
  };

  const descargarQRIndividual = async (puntoId, nombrePunto) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:3001/qr-generator/punto/${puntoId}?size=600`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al generar QR');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${nombrePunto.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando QR:', error);
      alert('Error al descargar código QR');
    }
  };

  const generarPDF = async () => {
    if (puntosSeleccionados.length === 0) {
      alert('Selecciona al menos un punto QR');
      return;
    }

    try {
      setGenerando(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:3001/qr-generator/generar-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          punto_ids: puntosSeleccionados
        })
      });

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Codigos_QR_Acrux_360.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(`PDF generado con ${puntosSeleccionados.length} código(s) QR`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar PDF');
    } finally {
      setGenerando(false);
    }
  };

  const mostrarPreview = (punto) => {
    setPreviewPunto(punto);
  };

  const puntosFiltrados = puntos.filter(p => 
    !filtroServicio || p.servicio_nombre === filtroServicio
  );

  return (
    <div className="generador-qr">
      <div className="admin-section-header">
        <h2>📱 Generador de Códigos QR</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-primary"
            onClick={generarPDF}
            disabled={puntosSeleccionados.length === 0 || generando}
          >
            {generando ? '⏳ Generando...' : `📄 Generar PDF (${puntosSeleccionados.length})`}
          </button>
        </div>
      </div>

      <div className="qr-controles">
        <div className="filtros">
          <select 
            value={filtroServicio}
            onChange={(e) => setFiltroServicio(e.target.value)}
          >
            <option value="">Todos los servicios</option>
            {servicios.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button className="btn-secondary" onClick={seleccionarTodos}>
            ✅ Seleccionar todos ({puntosFiltrados.length})
          </button>
          <button className="btn-secondary" onClick={deseleccionarTodos}>
            ❌ Deseleccionar todos
          </button>
        </div>

        <div className="info-seleccion">
          <span>{puntosSeleccionados.length} punto(s) seleccionado(s)</span>
        </div>
      </div>

      {loading ? (
        <p>Cargando puntos QR...</p>
      ) : (
        <div className="qr-grid">
          {puntosFiltrados.map((punto) => (
            <div 
              key={punto.id} 
              className={`qr-card ${puntosSeleccionados.includes(punto.id) ? 'selected' : ''}`}
            >
              <div className="qr-card-header">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={puntosSeleccionados.includes(punto.id)}
                    onChange={() => togglePunto(punto.id)}
                  />
                  <span className="checkmark"></span>
                </label>
                <h3>{punto.nombre}</h3>
              </div>

              <div className="qr-preview" onClick={() => mostrarPreview(punto)}>
                {previews[punto.id] ? (
                  <img 
                    src={previews[punto.id]}
                    alt={punto.nombre}
                    style={{ cursor: 'pointer' }}
                  />
                ) : (
                  <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    Cargando...
                  </div>
                )}
              </div>

              <div className="qr-info">
                <p><strong>Código:</strong> {punto.qr_code}</p>
                <p><strong>Servicio:</strong> {punto.servicio_nombre || 'N/A'}</p>
                {punto.descripcion && (
                  <p className="qr-descripcion">{punto.descripcion}</p>
                )}
              </div>

              <div className="qr-actions">
                <button 
                  className="btn-download"
                  onClick={() => descargarQRIndividual(punto.id, punto.nombre)}
                >
                  💾 Descargar PNG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {puntosFiltrados.length === 0 && !loading && (
        <p className="no-data">No hay puntos QR disponibles</p>
      )}

      {/* Modal de Preview */}
      {previewPunto && (
        <div className="modal-overlay" onClick={() => setPreviewPunto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewPunto(null)}>✕</button>
            <h2>{previewPunto.nombre}</h2>
            {previews[previewPunto.id] ? (
              <img 
                src={previews[previewPunto.id]}
                alt={previewPunto.nombre}
                style={{ width: '400px', height: '400px' }}
              />
            ) : (
              <div style={{ width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Cargando...
              </div>
            )}
            <p><strong>Código:</strong> {previewPunto.qr_code}</p>
            <button 
              className="btn-primary"
              onClick={() => {
                descargarQRIndividual(previewPunto.id, previewPunto.nombre);
                setPreviewPunto(null);
              }}
            >
              💾 Descargar este QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneradorQR;