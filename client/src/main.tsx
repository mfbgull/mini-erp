import React from 'react'

import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import ReactDOM from 'react-dom/client'

import App from './App'
import './styles/variables.css'
import './assets/styles/dark-mode.css'
import './styles/global.css'
import './styles/mobile-responsive.css'
import './styles/utilities/spacing.css'
import './styles/utilities/typography.css'
import './styles/utilities/layout.css'
import './styles/utilities/components.css'
import './styles/components/button.css'
import './styles/components/card.css'
import './styles/components/form.css'
import './styles/components/modal.css'
import './styles/components/table.css'
import './styles/pages/invoice.css'
import './styles/pages/inventory.css'
import './styles/pages/customers.css'
import './styles/pages/reports.css'
import './styles/rtl.css'
import { registerServiceWorker } from './utils/serviceWorker'
import './utils/webmcp'
import './utils/webmcp-mock'

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule])

// Initialize locale from localStorage
const savedLocale = localStorage.getItem('minierp_locale');
if (savedLocale && typeof document !== 'undefined') {
  document.documentElement.lang = savedLocale;
  document.documentElement.dir = savedLocale === 'ur' ? 'rtl' : 'ltr';
}

// Register service worker for PWA support (production only)
// Disabled in development to avoid cache conflicts with HMR
if (import.meta.env.PROD) {
  registerServiceWorker();
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
