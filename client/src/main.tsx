import React from 'react'
import ReactDOM from 'react-dom/client'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import App from './App'
import './assets/styles/variables.css'
import './assets/styles/global.css'
import './assets/styles/mobile-responsive.css'
import './assets/styles/erpnext-theme.css'
import './assets/styles/odoo-theme.css'
import './assets/styles/sap-theme.css'
import './assets/styles/default-theme.css'
import './components/common/SearchModal.css'
import './components/common/SearchableSelect.css'

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule])

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
