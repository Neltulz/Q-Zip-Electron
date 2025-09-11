import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// IPC message handler (Phase 1-4 consolidated setup)
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log('📨 Main process message:', message)
})
