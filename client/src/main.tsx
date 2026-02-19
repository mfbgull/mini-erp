import React from 'react'
import ReactDOM from 'react-dom/client'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import App from './App'
import './assets/styles/variables.css'
import './assets/styles/global.css'
import './assets/styles/mobile-responsive.css'
// Theme CSS loaded dynamically based on user preference
import './components/common/SearchModal.css'
import './components/common/SearchableSelect.css'
import { registerServiceWorker } from './utils/serviceWorker'
import './utils/webmcp'
import './utils/webmcp-mock'

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule])

// Register service worker for PWA support
registerServiceWorker();

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
