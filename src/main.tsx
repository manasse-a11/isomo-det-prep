import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PWAInstall from './PWAInstall';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('ISOMO offline support could not be enabled:', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <App />
      <PWAInstall />
    </>
  </StrictMode>
);
