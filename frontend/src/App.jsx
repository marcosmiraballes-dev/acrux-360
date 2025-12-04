import { useState, useEffect } from 'react';
import QRScanner from './components/QRScanner';
import VisitForm from './components/VisitForm';
import VisitList from './components/VisitList';
import SupervisorPanel from './components/supervisor/SupervisorPanel';
import AdminPanel from './components/admin/AdminPanel';
import api from './services/api';
import storage from './services/storage';
import sync from './services/sync';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); // login, scanner, form, list, supervisor, admin
  const [qrData, setQrData] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [devMode, setDevMode] = useState(true); // MODO DESARROLLO

  useEffect(() => {
    checkAuth();
    sync.startAutoSync(5);
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
        const savedUser = await storage.getUser();
        if (!savedUser) {
          await storage.saveUser(userData);
        }
        // Redirigir según el rol
        if (userData.rol === 'admin' || userData.rol === 'administrador') {
          setView('admin');
        } else if (userData.rol === 'supervisor') {
          setView('supervisor');
        } else {
          setView('scanner');
        }
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const response = await api.login(loginForm.email, loginForm.password);
      setUser(response.user);
      await storage.saveUser(response.user);
      
      // Redirigir según el rol
      if (response.user.rol === 'admin' || response.user.rol === 'administrador') {
        setView('admin');
      } else if (response.user.rol === 'supervisor') {
        setView('supervisor');
      } else {
        setView('scanner');
      }
    } catch (error) {
      setLoginError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    api.clearToken();
    await storage.clear();
    setUser(null);
    setView('login');
    setQrData(null);
  };

  const handleQRScan = (data) => {
    console.log('QR escaneado:', data);
    setQrData(data);
    setView('form');
  };

  const handleSimulateQR = () => {
    const simulatedQR = 'servicio:a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d:punto:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    console.log('QR simulado:', simulatedQR);
    setQrData(simulatedQR);
    setView('form');
  };

  const handleVisitSuccess = () => {
    setQrData(null);
    setView('scanner');
  };

  const handleVisitCancel = () => {
    setQrData(null);
    setView('scanner');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px'
      }}>
        ⏳ Cargando...
      </div>
    );
  }

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div style={{ 
        maxWidth: '400px', 
        margin: '50px auto', 
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#1976d2', marginBottom: '10px' }}>
          🔐 Sistema de Recorridas QR
        </h1>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          Ingresa tus credenciales para continuar
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email:
            </label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
              placeholder="usuario@ejemplo.com"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Contraseña:
            </label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          {loginError && (
            <div style={{
              background: '#ffcdd2',
              color: '#c62828',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              ⚠️ {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: loading ? '#ccc' : '#1976d2',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? '⏳ Ingresando...' : '🔑 Ingresar'}
          </button>

          <div style={{ 
            padding: '15px', 
            background: '#f5f5f5', 
            borderRadius: '4px',
            fontSize: '13px',
            color: '#666'
          }}>
            <strong>Usuarios de prueba:</strong><br/>
            • Guardia: guardia@ejemplo.com<br/>
            • Supervisor: supervisor@ejemplo.com<br/>
            • Admin: admin@ejemplo.com<br/>
            <em>Contraseña: password123</em>
          </div>
        </form>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* HEADER */}
      <header style={{
        background: (user?.rol === 'admin' || user?.rol === 'administrador') ? '#ff9800' : '#1976d2',
        color: 'white',
        padding: '15px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px' }}>
              {(user?.rol === 'admin' || user?.rol === 'administrador') ? '⚙️ Panel de Administración' : 'Sistema de Recorridas QR'}
            </h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              👤 {user?.nombre} - {(user?.rol === 'admin' || user?.rol === 'administrador') ? 'Administrador' : user?.rol}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {devMode && (
              <span style={{ 
                background: (user?.rol === 'admin' || user?.rol === 'administrador') ? '#f57c00' : '#ff9800', 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                🔧 MODO PRUEBA
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: '#d32f2f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION - Solo para guardias */}
      {user?.rol === 'guardia' && (
        <nav style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '10px 20px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                setQrData(null);
                setView('scanner');
              }}
              style={{
                padding: '10px 20px',
                background: view === 'scanner' ? '#1976d2' : 'white',
                color: view === 'scanner' ? 'white' : '#1976d2',
                border: '2px solid #1976d2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📷 Escanear QR
            </button>

            <button
              onClick={() => setView('list')}
              style={{
                padding: '10px 20px',
                background: view === 'list' ? '#1976d2' : 'white',
                color: view === 'list' ? 'white' : '#1976d2',
                border: '2px solid #1976d2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📋 Historial
            </button>
          </div>
        </nav>
      )}

      {/* CONTENT */}
      <main style={{ padding: '20px' }}>
        {/* VISTA ADMINISTRADOR */}
        {view === 'admin' && (user?.rol === 'admin' || user?.rol === 'administrador') && (
          <AdminPanel />
        )}

        {/* VISTA SUPERVISOR */}
        {view === 'supervisor' && (user?.rol === 'supervisor' || user?.rol === 'admin') && (
          <SupervisorPanel user={user} />
        )}

        {/* VISTAS GUARDIA */}
        {user?.rol === 'guardia' && (
          <>
            {view === 'scanner' && !qrData && (
              <div>
                <h2 style={{ textAlign: 'center' }}>📷 Escanea un código QR</h2>
                
                {devMode && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '20px',
                    padding: '20px',
                    background: '#fff3cd',
                    borderRadius: '8px',
                    border: '2px dashed #ff9800'
                  }}>
                    <p style={{ marginBottom: '10px', color: '#856404' }}>
                      🔧 <strong>Modo Prueba:</strong> Simula el escaneo de un QR
                    </p>
                    <button
                      onClick={handleSimulateQR}
                      style={{
                        padding: '15px 30px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        background: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      🎯 SIMULAR ESCANEO QR
                    </button>
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                      Punto: Entrada Principal - Edificio Central
                    </p>
                  </div>
                )}

                <QRScanner 
                  onScan={handleQRScan}
                  onError={(err) => console.error('Error de cámara:', err)}
                />
              </div>
            )}

            {view === 'form' && qrData && (
              <VisitForm
                qrData={qrData}
                user={user}
                onSuccess={handleVisitSuccess}
                onCancel={handleVisitCancel}
                devMode={devMode}
              />
            )}

            {view === 'list' && (
              <VisitList user={user} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;