import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import { AuthProvider } from './services/firebase';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Register Service Worker only in production to avoid stale developer caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker active!', reg.scope))
        .catch((err) => console.error('Service Worker registration error:', err));
    });
  } else {
    // In development mode, actively unregister existing service workers to clear any stale developer cache
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) console.log('Development mode: cleared stale service worker.');
        });
      }
    }).catch((err) => console.warn('Error clearing service workers:', err));
  }
}