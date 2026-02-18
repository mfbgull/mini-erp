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
