import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/tailwind.css'
import './styles/global.css'
// Buffer polyfill is no longer needed - we handle browser compatibility directly in the services

// Import debug utilities to make them available in browser console
import './debug-utils'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 