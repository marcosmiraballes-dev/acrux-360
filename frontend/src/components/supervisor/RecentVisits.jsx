function RecentVisits({ visitas }) {
  if (!visitas || visitas.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>🕐 Visitas Recientes</h2>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: 'white',
          borderRadius: '8px',
          color: '#757575'
        }}>
          <p style={{ fontSize: '48px' }}>📋</p>
          <p>No hay visitas registradas</p>
        </div>
      </div>
    );
  }

  // Ordenar por más reciente
  const sortedVisitas = [...visitas].sort((a, b) => 
    new Date(b.fecha_hora) - new Date(a.fecha_hora)
  ).slice(0, 10); // Solo las últimas 10

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'normal': return '#4caf50';
      case 'observacion': return '#ff9800';
      case 'incidencia': return '#f44336';
      default: return '#757575';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'normal': return '✓';
      case 'observacion': return '⚠';
      case 'incidencia': return '⚠';
      default: return '○';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} horas`;
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🕐 Visitas Recientes</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sortedVisitas.map((visita) => (
          <div
            key={visita.id}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            {/* Icono de tipo */}
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: getTipoColor(visita.tipo),
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {getTipoIcon(visita.tipo)}
            </div>

            {/* Información */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <span style={{
                  background: getTipoColor(visita.tipo),
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {visita.tipo.toUpperCase()}
                </span>
                <span style={{ fontSize: '13px', color: '#666' }}>
                  {formatDate(visita.fecha_hora)}
                </span>
              </div>

              {visita.observacion && (
                <p style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '14px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  "{visita.observacion}"
                </p>
              )}

              {!visita.sincronizado && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '5px',
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: '#fff3cd',
                  color: '#856404',
                  borderRadius: '12px'
                }}>
                  📴 Pendiente de sincronizar
                </span>
              )}
            </div>

            {/* Flecha */}
            <div style={{ fontSize: '20px', color: '#ccc' }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentVisits;