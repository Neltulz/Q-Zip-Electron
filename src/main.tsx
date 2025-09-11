import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Diagnostics to verify preload API availability
try {
  // eslint-disable-next-line no-console
  console.log('[renderer] window.api available:', !!(window as any).api);
} catch { }
