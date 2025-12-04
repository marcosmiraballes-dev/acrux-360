import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapView({ puntos, visitas }) {
  const [center, setCenter] = useState([20.6296, -87.0739]); // Playa del Carmen por defecto

  useEffect(() => {
    if (puntos && puntos.length > 0) {
      setCenter([puntos[0].latitud, puntos[0].longitud]);
    }
  }, [puntos]);

  // Crear icono personalizado para puntos QR
  const qrIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const getLastVisit = (puntoId) => {
    if (!visitas) return null;
    const puntoVisits = visitas.filter(v => v.punto_qr_id === puntoId);
    if (puntoVisits.length === 0) return null;
    return puntoVisits.sort((a, b) => 
      new Date(b.fecha_hora) - new Date(a.fecha_hora)
    )[0];
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🗺️ Mapa de Puntos QR</h2>
      
      <div style={{ 
        height: '600px', 
        borderRadius: '8px', 
        overflow: 'hidden',
        border: '2px solid #e0e0e0'
      }}>
        <MapContainer 
          center={center} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {puntos && puntos.map((punto) => {
            const lastVisit = getLastVisit(punto.id);
            
            return (
              <div key={punto.id}>
                {/* Marcador del punto */}
                <Marker 
                  position={[punto.latitud, punto.longitud]}
                  icon={qrIcon}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h3 style={{ margin: '0 0 10px 0' }}>{punto.nombre}</h3>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Descripción:</strong> {punto.descripcion || 'N/A'}
                      </p>
                      {lastVisit ? (
                        <>
                          <p style={{ margin: '5px 0', color: '#4caf50' }}>
                            <strong>✅ Última visita:</strong><br/>
                            {new Date(lastVisit.fecha_hora).toLocaleString('es-MX')}
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong>Tipo:</strong> {lastVisit.tipo}
                          </p>
                        </>
                      ) : (
                        <p style={{ margin: '5px 0', color: '#f44336' }}>
                          <strong>⚠️ Sin visitas registradas</strong>
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
                
                {/* Círculo de radio GPS (50m) */}
                <Circle
                  center={[punto.latitud, punto.longitud]}
                  radius={50}
                  pathOptions={{ 
                    color: lastVisit ? '#4caf50' : '#f44336',
                    fillColor: lastVisit ? '#4caf50' : '#f44336',
                    fillOpacity: 0.1
                  }}
                />
              </div>
            );
          })}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div style={{ 
        marginTop: '15px', 
        padding: '15px', 
        background: 'white',
        borderRadius: '8px',
        display: 'flex',
        gap: '20px',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: '#4caf50',
            border: '2px solid #2e7d32'
          }}></div>
          <span>Visitado recientemente</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: '#f44336',
            border: '2px solid #c62828'
          }}></div>
          <span>Sin visitas</span>
        </div>
      </div>
    </div>
  );
}

export default MapView;