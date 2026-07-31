self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
  self.registration.unregister().then(() => {
    console.log('Service worker unregistered successfully.');
  });
});
