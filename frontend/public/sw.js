const CACHE_NAME = 'recorridas-qr-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción de peticiones - NO cachear peticiones al backend
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones al backend (API)
  if (event.request.url.includes('127.0.0.1:3001') || 
      event.request.url.includes('localhost:3001')) {
    return; // Dejar que la petición pase sin interceptar
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-visits') {
    event.waitUntil(syncVisits());
  }
});

async function syncVisits() {
  // Lógica de sincronización
  console.log('Sincronizando visitas offline...');
}