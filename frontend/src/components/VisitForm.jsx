import { useState, useEffect } from 'react';
import api from '../services/api';
import storage from '../services/storage';

function VisitForm({ qrData, user, onSuccess, onCancel, devMode = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tipo, setTipo] = useState('normal');
  const [observacion, setObservacion] = useState('');
  const [location, setLocation] = useState(null);
  const [gpsValid, setGpsValid] = useState(null);
  const [puntoInfo, setPuntoInfo] = useState(null);

  useEffect(() => {
    validateQRAndGetLocation();
  }, []);

  const validateQRAndGetLocation = async () => {
    try {
      setLoading(true);

      // Validar QR
      const qrValidation = await api.validateQR(qrData, user.id);
      
      if (!qrValidation.valid) {
        setError(qrValidation.message);
        setLoading(false);
        return;
      }

      setPuntoInfo(qrValidation);

      // MODO DESARROLLO: Simular GPS válido
      if (devMode) {
        setLocation({ 
          lat: qrValidation.punto_lat, 
          lng: qrValidation.punto_lng 
        });
        setGpsValid(true);
        setLoading(false);
        return;
      }

      // Obtener ubicación GPS real
      if (!navigator.geolocation) {
        setError('Tu dispositivo no soporta geolocalización');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const deviceLat = position.coords.latitude;
          const deviceLng = position.coords.longitude;

          setLocation({ lat: deviceLat, lng: deviceLng });

          // Validar GPS
          const gpsValidation = await api.validateGPS(
            qrValidation.punto_lat,
            qrValidation.punto_lng,
            deviceLat,
            deviceLng
          );

          setGpsValid(gpsValidation.valid);

          if (!gpsValidation.valid) {
            setError(gpsValidation.message);
          }

          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('No se pudo obtener tu ubicación. Activa el GPS.');
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!gpsValid) {
      alert('Tu ubicación no es válida para este punto');
      return;
    }

    setLoading(true);
    setError(null);

    const visitData = {
      servicio_id: puntoInfo.servicio_id,
      punto_qr_id: puntoInfo.punto_id,
      guardia_id: user.id,
      tipo,
      observacion: observacion || null,
      latitud: location.lat,
      longitud: location.lng,
      fecha_hora: new Date().toISOString()
    };

    try {
      await api.createVisit(visitData);
      alert('✅ Visita registrada correctamente');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.log('Sin conexión, guardando offline...');
      await storage.saveVisitOffline(visitData);
      alert('📴 Visita guardada offline. Se sincronizará cuando haya conexión.');
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  if (loading && !puntoInfo) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Validando QR y ubicación...</div>;
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>📝 Registrar Visita</h2>

      {devMode && (
        <div style={{
          background: '#fff3cd',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          color: '#856404'
        }}>
          🔧 Modo Prueba: GPS automáticamente válido
        </div>
      )}

      {puntoInfo && (
        <div style={{ 
          background: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <p><strong>Servicio:</strong> {puntoInfo.servicio_nombre}</p>
          <p><strong>Punto:</strong> {puntoInfo.punto_nombre}</p>
          <p><strong>Guardia:</strong> {user.nombre}</p>
        </div>
      )}

      {gpsValid === true && (
        <div style={{ 
          background: '#c8e6c9', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          color: '#2e7d32'
        }}>
          ✅ Ubicación GPS válida
        </div>
      )}

      {gpsValid === false && (
        <div style={{ 
          background: '#ffcdd2', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          color: '#c62828'
        }}>
          ❌ {error}
        </div>
      )}

      {error && gpsValid === null && (
        <div style={{ 
          background: '#ffcdd2', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          color: '#c62828'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Tipo de visita:
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="normal">Normal</option>
            <option value="observacion">Observación</option>
            <option value="incidencia">Incidencia</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Observación (opcional):
          </label>
          <textarea
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            rows="4"
            placeholder="Escribe tus observaciones aquí..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading || !gpsValid}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: (loading || !gpsValid) ? '#ccc' : '#1976d2',
              border: 'none',
              borderRadius: '4px',
              cursor: (loading || !gpsValid) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Guardando...' : '✅ Registrar Visita'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: loading ? '#ccc' : '#d32f2f',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            ❌ Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default VisitForm;