import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initDisableZoom } from './lib/disableZoom.ts';
import './index.css';

initDisableZoom();

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
