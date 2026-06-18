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

// Register Service Worker for robust progressive web app offline capability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker active!', reg.scope))
      .catch((err) => console.error('Service Worker registration error:', err));
  });
}