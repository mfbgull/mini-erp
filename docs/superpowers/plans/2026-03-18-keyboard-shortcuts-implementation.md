# Keyboard Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive keyboard shortcuts system for Mini ERP with context-aware actions, input guards, and AG-Grid integration.

**Architecture:** Create a KeyboardShortcutsContext provider that manages shortcut registration, context detection using React Router hooks, and input guard logic to prevent shortcuts from firing while typing. Integrate with existing AG-Grid components and add visual hints in the UI.

**Tech Stack:** React 19, TypeScript, React Router 7, AG-Grid Community, Lucide icons

---

## File Structure Mapping

### New Files

| File | Responsibility |
|------|----------------|
| `client/src/context/KeyboardShortcutsContext.tsx` | Main context provider, shortcut registry, global handler |
| `client/src/components/common/KeyboardShortcutsHelp.tsx` | Help modal showing all shortcuts organized by context |
| `client/src/hooks/useKeyboardShortcut.ts` | Custom hook for components to register shortcuts |
| `client/src/utils/contextDetection.ts` | React Router-based context detection |
| `client/src/utils/inputGuard.ts` | Logic to ignore shortcuts when user is typing |
| `client/src/utils/agGridIntegration.ts` | AG-Grid editing/focus detection helpers |
| `client/src/utils/shortcuts.ts` | Shortcut registry management utilities |

### Modified Files

| File | Changes |
|------|---------|
| `client/src/App.tsx` | Add KeyboardShortcutsProvider wrapper, register global shortcuts |
| `client/src/components/layout/TopMenu.tsx` | Add shortcut hints to menu items, help button in user menu |
| `client/src/components/layout/Sidebar.tsx` | Add shortcut hints to nav items |
| `client/src/pages/Dashboard.tsx` | Register dashboard-specific shortcuts |
| `client/src/pages/inventory/ItemsPage.tsx` | Register inventory shortcuts |
| `client/src/pages/sales/SalesPage.tsx` | Register sales shortcuts |
| `client/src/pages/reports/ReportsDashboard.tsx` | Register reports shortcuts |

---

## Chunk 1: Foundation Utilities

### Task 1.1: Context Detection Utilities

**Files:**
- Create: `client/src/utils/contextDetection.ts`

- [ ] **Step 1: Write context detection utility**

```typescript
// client/src/utils/contextDetection.ts
import { useLocation } from 'react-router-dom';

export function useCurrentContext(): string {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/sales') || pathname.startsWith('/pos')) return 'sales';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/purchases')) return 'purchases';
  if (pathname.startsWith('/forecasts')) return 'forecasts';
  if (pathname.includes('/form') || pathname.includes('/edit')) return 'form';
  if (pathname.includes('/detail') || pathname.includes('/view')) return 'detail';

  return 'global';
}

export function usePageType(): string {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname.includes('/form') || pathname.includes('/edit')) return 'form';
  if (pathname.includes('/detail') || pathname.includes('/view')) return 'detail';
  if (pathname.includes('/create')) return 'create';
  
  return 'list';
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/utils/contextDetection.ts
git commit -m "feat: add context detection utilities with React Router hooks"
```

### Task 1.2: Input Guard Utilities

**Files:**
- Create: `client/src/utils/inputGuard.ts`

- [ ] **Step 1: Write input guard utility**

```typescript
// client/src/utils/inputGuard.ts
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  const activeElement = document.activeElement;
  
  // Ignore if typing in input/textarea/contenteditable
  if (activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.getAttribute('contenteditable') === 'true'
  )) {
    // Exception: Allow Ctrl+S in forms (save action)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 's') {
        return false; // Allow save shortcut in forms
      }
    }
    return true; // Ignore all other shortcuts while typing
  }
  
  // Check if AG-Grid cell is being edited
  if (activeElement && activeElement.classList.contains('ag-cell-edit-handle')) {
    return true;
  }
  
  return false;
}

export function isInputElement(element: Element | null): boolean {
  if (!element) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.getAttribute('contenteditable') === 'true'
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/utils/inputGuard.ts
git commit -m "feat: add input guard utilities to prevent shortcuts while typing"
```

### Task 1.3: AG-Grid Integration Utilities

**Files:**
- Create: `client/src/utils/agGridIntegration.ts`

- [ ] **Step 1: Write AG-Grid integration helpers**

```typescript
// client/src/utils/agGridIntegration.ts
import { GridApi } from 'ag-grid-community';

export function isAGGridEditing(api: GridApi | null): boolean {
  if (!api) return false;
  return api.getEditingCells().length > 0;
}

export function isAGGridCellFocused(api: GridApi | null): boolean {
  if (!api) return false;
  const focusedCell = api.getFocusedCell();
  return focusedCell !== null;
}

export function shouldIgnoreForAGGrid(api: GridApi | null): boolean {
  if (!api) return false;
  return isAGGridEditing(api) || isAGGridCellFocused(api);
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/utils/agGridIntegration.ts
git commit -m "feat: add AG-Grid integration utilities"
```

---

## Chunk 2: Core Keyboard Shortcuts System

### Task 2.1: Keyboard Shortcuts Context

**Files:**
- Create: `client/src/context/KeyboardShortcutsContext.tsx`

- [ ] **Step 1: Write KeyboardShortcutsContext**

```typescript
// client/src/context/KeyboardShortcutsContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentContext } from '../utils/contextDetection';
import { shouldIgnoreShortcut } from '../utils/inputGuard';

interface KeyboardShortcut {
  id: string;
  key: string;
  action: string;
  context: string;
  handler: () => void;
  enabled?: boolean;
}

interface KeyboardShortcutsContextType {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  getShortcutsForContext: (context: string) => KeyboardShortcut[];
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function useKeyboardShortcuts(): KeyboardShortcutsContextType {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const currentContext = useCurrentContext();

  const registerShortcut = (shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      // Avoid duplicates
      if (prev.find(s => s.id === shortcut.id)) {
        return prev.map(s => s.id === shortcut.id ? shortcut : s);
      }
      return [...prev, shortcut];
    });
  };

  const unregisterShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  };

  const getShortcutsForContext = (context: string) => {
    return shortcuts.filter(s => s.context === context && s.enabled !== false);
  };

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input
      if (shouldIgnoreShortcut(event)) {
        return;
      }

      // Handle help panel shortcut (Ctrl+/ or Ctrl+?)
      if ((event.ctrlKey || event.metaKey) && (event.key === '/' || event.key === '?')) {
        event.preventDefault();
        setIsHelpOpen(prev => !prev);
        return;
      }

      // Handle escape to close help
      if (event.key === 'Escape' && isHelpOpen) {
        event.preventDefault();
        setIsHelpOpen(false);
        return;
      }

      // Check global shortcuts first
      const globalShortcuts = getShortcutsForContext('global');
      for (const shortcut of globalShortcuts) {
        if (matchesShortcut(event, shortcut.key)) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }

      // Check context-specific shortcuts
      const contextShortcuts = getShortcutsForContext(currentContext);
      for (const shortcut of contextShortcuts) {
        if (matchesShortcut(event, shortcut.key)) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, currentContext, isHelpOpen]);

  const value: KeyboardShortcutsContextType = {
    registerShortcut,
    unregisterShortcut,
    getShortcutsForContext,
    showHelp: () => setIsHelpOpen(true),
    hideHelp: () => setIsHelpOpen(false),
    isHelpOpen,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

function matchesShortcut(event: KeyboardEvent, keyPattern: string): boolean {
  const parts = keyPattern.split('+');
  let hasCtrl = false;
  let hasAlt = false;
  let hasShift = false;
  let targetKey = '';

  parts.forEach(part => {
    if (part.toLowerCase() === 'ctrl') hasCtrl = true;
    else if (part.toLowerCase() === 'alt') hasAlt = true;
    else if (part.toLowerCase() === 'shift') hasShift = true;
    else targetKey = part.toLowerCase();
  });

  const isModKey = event.ctrlKey || event.metaKey;
  
  return (
    hasCtrl === isModKey &&
    hasAlt === event.altKey &&
    hasShift === event.shiftKey &&
    event.key.toLowerCase() === targetKey
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/context/KeyboardShortcutsContext.tsx
git commit -m "feat: add KeyboardShortcutsContext provider"
```

### Task 2.2: useKeyboardShortcut Hook

**Files:**
- Create: `client/src/hooks/useKeyboardShortcut.ts`

- [ ] **Step 1: Write useKeyboardShortcut hook**

```typescript
// client/src/hooks/useKeyboardShortcut.ts
import { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '../context/KeyboardShortcutsContext';
import { useCurrentContext } from '../utils/contextDetection';

interface UseKeyboardShortcutOptions {
  context?: string;
  enabled?: boolean;
  id?: string;
}

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: UseKeyboardShortcutOptions = {}
): void {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const handlerRef = useRef(handler);
  const currentContext = useCurrentContext();
  
  // Update handler ref on changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const shortcutId = options.id || `${options.context || currentContext}-${key}`;
    
    const shortcut = {
      id: shortcutId,
      key,
      action: handler.toString(), // Placeholder - will be descriptive in real usage
      context: options.context || currentContext,
      handler: () => handlerRef.current(),
      enabled: options.enabled !== false,
    };

    registerShortcut(shortcut);

    return () => {
      unregisterShortcut(shortcutId);
    };
  }, [key, options.context, currentContext, options.enabled, options.id, registerShortcut, unregisterShortcut]);
}

export default useKeyboardShortcut;
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/useKeyboardShortcut.ts
git commit -m "feat: add useKeyboardShortcut hook for components"
```

---

## Chunk 3: UI Components

### Task 3.1: Keyboard Shortcuts Help Modal

**Files:**
- Create: `client/src/components/common/KeyboardShortcutsHelp.tsx`

- [ ] **Step 1: Write KeyboardShortcutsHelp component**

```typescript
// client/src/components/common/KeyboardShortcutsHelp.tsx
import { useKeyboardShortcuts } from '../../context/KeyboardShortcutsContext';
import { X, Search } from 'lucide-react';
import { useState } from 'react';

export function KeyboardShortcutsHelp() {
  const { isHelpOpen, hideHelp, getShortcutsForContext } = useKeyboardShortcuts();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isHelpOpen) return null;

  const contexts = ['global', 'dashboard', 'inventory', 'sales', 'reports', 'purchases', 'forecasts'];
  
  const filteredShortcuts = contexts.flatMap(context => 
    getShortcutsForContext(context).map(shortcut => ({ ...shortcut, context }))
  ).filter(shortcut => 
    shortcut.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shortcut.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="keyboard-shortcuts-help-overlay" onClick={hideHelp}>
      <div className="keyboard-shortcuts-help-modal" onClick={e => e.stopPropagation()}>
        <div className="keyboard-shortcuts-help-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="close-btn" onClick={hideHelp} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="keyboard-shortcuts-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="keyboard-shortcuts-content">
          {contexts.map(context => {
            const contextShortcuts = getShortcutsForContext(context);
            if (contextShortcuts.length === 0) return null;

            return (
              <div key={context} className="shortcuts-section">
                <h3>{context.charAt(0).toUpperCase() + context.slice(1)}</h3>
                <div className="shortcuts-list">
                  {contextShortcuts.map(shortcut => (
                    <div key={shortcut.id} className="shortcut-item">
                      <span className="shortcut-action">{shortcut.action}</span>
                      <kbd className="shortcut-key">{shortcut.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="keyboard-shortcuts-footer">
          <p>Press <kbd>Ctrl</kbd> + <kbd>/</kbd> or <kbd>Ctrl</kbd> + <kbd>?</kbd> to toggle this panel</p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsHelp;
```

- [ ] **Step 2: Add CSS styles**

Create: `client/src/components/common/KeyboardShortcutsHelp.css`

```css
.keyboard-shortcuts-help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.keyboard-shortcuts-help-modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.keyboard-shortcuts-help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.keyboard-shortcuts-help-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
}

.keyboard-shortcuts-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.keyboard-shortcuts-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
}

.keyboard-shortcuts-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.shortcuts-section {
  margin-bottom: 20px;
}

.shortcuts-section h3 {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.shortcut-action {
  font-size: 14px;
}

.shortcut-key {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.keyboard-shortcuts-footer {
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

.keyboard-shortcuts-footer kbd {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add client/src/components/common/KeyboardShortcutsHelp.tsx client/src/components/common/KeyboardShortcutsHelp.css
git commit -m "feat: add KeyboardShortcutsHelp modal component"
```

### Task 3.2: Integrate KeyboardShortcutsProvider in App

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Add KeyboardShortcutsProvider import and wrapper**

```typescript
// In client/src/App.tsx
import { KeyboardShortcutsProvider } from './context/KeyboardShortcutsContext';
import { KeyboardShortcutsHelp } from './components/common/KeyboardShortcutsHelp';

// In App() function, wrap the return with KeyboardShortcutsProvider:
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <KeyboardShortcutsProvider>  {/* Add this */}
              <InvoiceProvider>
                <AppRoutesOuter />
              </InvoiceProvider>
              <KeyboardShortcutsHelp />    {/* Add this */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff'
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--success)',
                      secondary: '#fff'
                    }
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--error)',
                      secondary: '#fff'
                    }
                  }
                }}
              />
            </KeyboardShortcutsProvider>   {/* Add this */}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Test the app starts**

Run: `cd client && npm run dev`
Expected: App starts without errors

- [ ] **Step 4: Commit**

```bash
git add client/src/App.tsx
git commit -m "feat: integrate KeyboardShortcutsProvider in App"
```

---

## Chunk 4: Context-Specific Shortcuts

### Task 4.1: Dashboard Shortcuts

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`

- [ ] **Step 1: Add dashboard shortcuts**

```typescript
// In client/src/pages/Dashboard.tsx
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();

  // Alt+N: Quick add (navigate to most relevant form)
  useKeyboardShortcut('Alt+N', () => {
    // Logic to determine most relevant form
    navigate('/inventory/items/create');
  }, { context: 'dashboard', id: 'dashboard-quick-add' });

  // Alt+R: Refresh dashboard
  useKeyboardShortcut('Alt+R', () => {
    // Trigger refresh logic
    window.location.reload(); // Simple refresh for now
  }, { context: 'dashboard', id: 'dashboard-refresh' });

  // Rest of component...
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Dashboard.tsx
git commit -m "feat: add dashboard keyboard shortcuts"
```

### Task 4.2: Inventory Shortcuts

**Files:**
- Modify: `client/src/pages/inventory/ItemsPage.tsx`

- [ ] **Step 1: Add inventory shortcuts**

```typescript
// In client/src/pages/inventory/ItemsPage.tsx
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useNavigate } from 'react-router-dom';

export function ItemsPage() {
  const navigate = useNavigate();

  // Alt+N: Create new item
  useKeyboardShortcut('Alt+N', () => {
    navigate('/inventory/items/create');
  }, { context: 'inventory', id: 'inventory-new-item' });

  // Alt+I: Open items list (already on this page)
  useKeyboardShortcut('Alt+I', () => {
    // Refresh or focus search
    console.log('Focus items search');
  }, { context: 'inventory', id: 'inventory-focus-items' });

  // Alt+W: Open warehouses
  useKeyboardShortcut('Alt+W', () => {
    navigate('/inventory/warehouses');
  }, { context: 'inventory', id: 'inventory-go-warehouses' });

  // Rest of component...
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/inventory/ItemsPage.tsx
git commit -m "feat: add inventory keyboard shortcuts"
```

### Task 4.3: Sales Shortcuts

**Files:**
- Modify: `client/src/pages/sales/SalesPage.tsx`

- [ ] **Step 1: Add sales shortcuts**

```typescript
// In client/src/pages/sales/SalesPage.tsx
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useNavigate } from 'react-router-dom';

export function SalesPage() {
  const navigate = useNavigate();

  // Alt+N: Create new invoice
  useKeyboardShortcut('Alt+N', () => {
    navigate('/sales/invoice');
  }, { context: 'sales', id: 'sales-new-invoice' });

  // Alt+O: Open POS
  useKeyboardShortcut('Alt+O', () => {
    navigate('/pos');
  }, { context: 'sales', id: 'sales-open-pos' });

  // Alt+C: Open customers
  useKeyboardShortcut('Alt+C', () => {
    navigate('/customers');
  }, { context: 'sales', id: 'sales-open-customers' });

  // Rest of component...
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/sales/SalesPage.tsx
git commit -m "feat: add sales keyboard shortcuts"
```

---

## Chunk 5: UI Hints and Polish

### Task 5.1: Add Shortcut Hints to TopMenu

**Files:**
- Modify: `client/src/components/layout/TopMenu.tsx`

- [ ] **Step 1: Add shortcut hints to menu items**

```typescript
// In TopMenu.tsx, modify the NavLink items to show shortcuts:
<NavLink
  key={item.path}
  to={item.path!}
  className={({ isActive }) => `top-menu-item ${isActive ? 'active' : ''}`}
>
  <span>{item.label}</span>
  {item.path === '/' && <span className="shortcut-hint">Alt+1</span>}
  {item.path === '/inventory/items' && <span className="shortcut-hint">Alt+I</span>}
  {item.path === '/sales' && <span className="shortcut-hint">Alt+S</span>}
  // Add more as needed
</NavLink>
```

- [ ] **Step 2: Add CSS for shortcut hints**

Add to `client/src/components/layout/TopMenu.css`:
```css
.shortcut-hint {
  font-size: 10px;
  color: #9ca3af;
  margin-left: 4px;
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/TopMenu.tsx client/src/components/layout/TopMenu.css
git commit -m "feat: add shortcut hints to TopMenu"
```

### Task 5.2: Add Help Button to User Menu

**Files:**
- Modify: `client/src/components/layout/TopMenu.tsx`

- [ ] **Step 1: Add help button to user dropdown**

```typescript
// In TopMenu.tsx, add to user menu:
<div className="top-menu-user-menu">
  <div className="top-menu-user-info">
    <div className="top-menu-user-role">{user?.role}</div>
  </div>
  <button className="top-menu-help-btn" onClick={() => {/* open help */}}>
    <HelpCircle size={16} />
    <span>Keyboard Shortcuts</span>
  </button>
  <button className="top-menu-logout-btn" onClick={logout}>
    <LogOut size={16} />
    <span>Logout</span>
  </button>
</div>
```

- [ ] **Step 2: Connect help button to context**

```typescript
import { useKeyboardShortcuts } from '../../context/KeyboardShortcutsContext';

const { showHelp } = useKeyboardShortcuts();

// In help button onClick:
<button className="top-menu-help-btn" onClick={showHelp}>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/TopMenu.tsx
git commit -m "feat: add keyboard shortcuts help button to user menu"
```

---

## Chunk 6: Testing and Verification

### Task 6.1: Write Unit Tests

**Files:**
- Create: `client/src/utils/contextDetection.test.ts`
- Create: `client/src/utils/inputGuard.test.ts`
- Create: `client/src/hooks/useKeyboardShortcut.test.ts`

- [ ] **Step 1: Write context detection tests**

```typescript
// client/src/utils/contextDetection.test.ts
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCurrentContext } from './contextDetection';

describe('useCurrentContext', () => {
  it('returns dashboard for root path', () => {
    const { result } = renderHook(() => useCurrentContext(), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    });
    expect(result.current).toBe('dashboard');
  });

  it('returns inventory for inventory paths', () => {
    const { result } = renderHook(() => useCurrentContext(), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/inventory/items']}>{children}</MemoryRouter>
    });
    expect(result.current).toBe('inventory');
  });
});
```

- [ ] **Step 2: Write input guard tests**

```typescript
// client/src/utils/inputGuard.test.ts
import { shouldIgnoreShortcut } from './inputGuard';

describe('shouldIgnoreShortcut', () => {
  it('returns true for input elements', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    const event = new KeyboardEvent('keydown', { key: 'a' });
    expect(shouldIgnoreShortcut(event)).toBe(true);
    
    document.body.removeChild(input);
  });

  it('returns false for Ctrl+S in input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    expect(shouldIgnoreShortcut(event)).toBe(false);
    
    document.body.removeChild(input);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd client && npm test`
Expected: Tests pass

- [ ] **Step 4: Commit**

```bash
git add client/src/utils/*.test.ts
git commit -m "test: add unit tests for keyboard shortcuts utilities"
```

### Task 6.2: Manual Testing Checklist

- [ ] **Test 1:** Press `Ctrl+/` - Help panel should open
- [ ] **Test 2:** Press `Escape` - Help panel should close
- [ ] **Test 3:** Type in input field, press `Alt+N` - Should not trigger shortcut
- [ ] **Test 4:** Press `Alt+N` on Dashboard - Should navigate to create item
- [ ] **Test 5:** Press `Alt+I` on Inventory - Should focus items search
- [ ] **Test 6:** Press `Alt+W` on Inventory - Should navigate to warehouses
- [ ] **Test 7:** Press `Alt+N` on Sales - Should create new invoice
- [ ] **Test 8:** Press `Alt+O` on Sales - Should open POS
- [ ] **Test 9:** Press `Alt+C` on Sales - Should open customers
- [ ] **Test 10:** Verify AG-Grid navigation still works with arrow keys

### Task 6.3: Documentation

- [ ] **Step 1: Update user documentation**

Create: `client/docs/KeyboardShortcuts-Guide.md`

```markdown
# Keyboard Shortcuts Guide

## Overview
Mini ERP now supports keyboard shortcuts for faster navigation and actions.

## Global Shortcuts
- `Ctrl+K` or `Cmd+K` - Open search/command palette
- `Ctrl+/` or `Ctrl+?` - Show keyboard shortcuts help
- `Escape` - Close modals and dialogs
- `Ctrl+P` - Print current view

## Context-Aware Shortcuts

### Dashboard
- `Alt+N` - Quick add (opens most relevant form)
- `Alt+R` - Refresh dashboard

### Inventory
- `Alt+N` - Create new item
- `Alt+I` - Focus items search
- `Alt+W` - Open warehouses

### Sales
- `Alt+N` - Create new invoice
- `Alt+O` - Open POS terminal
- `Alt+C` - Open customers

### Forms
- `Ctrl+S` - Save current form
```

- [ ] **Step 2: Commit documentation**

```bash
git add client/docs/KeyboardShortcuts-Guide.md
git commit -m "docs: add keyboard shortcuts user guide"
```

---

## Final Verification

- [ ] **Step 1: Run full test suite**

Run: `cd client && npm test`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript compilation**

Run: `cd client && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Manual end-to-end test**

1. Start the app: `cd client && npm run dev`
2. Navigate through different modules
3. Test all shortcuts
4. Verify help panel works
5. Verify input guards work

- [ ] **Step 4: Create release commit**

```bash
git add .
git commit -m "feat: implement keyboard shortcuts system

- Add context-aware shortcuts with Alt+key combinations
- Add input guards to prevent shortcuts while typing
- Add AG-Grid integration for cell editing
- Add keyboard shortcuts help panel (Ctrl+/)
- Add visual hints in UI menus
- Add comprehensive tests

Fixes browser shortcut conflicts by using Alt modifier instead of Ctrl for context actions."
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-18-keyboard-shortcuts-implementation.md`. Ready to execute?**
