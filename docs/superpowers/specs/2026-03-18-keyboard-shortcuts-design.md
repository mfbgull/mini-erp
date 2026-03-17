# Keyboard Shortcuts Design Specification

**Date:** 2026-03-18
**Topic:** Context-Aware Action Shortcuts for Mini ERP
**Status:** Draft
**Version:** 1.0

---

## 1. Overview

### 1.1 Purpose
Implement a comprehensive keyboard shortcuts system for the Mini ERP application that provides quick access to common actions based on the current context (module/page).

### 1.2 Goals
- Reduce time to perform common actions by 50%
- Improve user productivity through efficient keyboard navigation
- Provide context-aware shortcuts that adapt to current module
- Maintain accessibility with visual alternatives for all shortcuts

### 1.3 Scope
- Global shortcuts (always available)
- Context-aware shortcuts (module-specific)
- Keyboard shortcuts help panel
- Command palette enhancements
- Visual hints in UI

---

## 2. Architecture

### 2.1 System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Keyboard Shortcuts System                 │
├─────────────────────────────────────────────────────────────┤
│  KeyboardShortcutsContext (Provider)                        │
│  ├─ Shortcut Registry                                       │
│  ├─ Context Detection (Route-based)                         │
│  ├─ Global Shortcuts Handler                                │
│  └─ Context-Specific Shortcuts Handler                      │
├─────────────────────────────────────────────────────────────┤
│  Components                                                 │
│  ├─ KeyboardShortcutsHelp (Modal)                           │
│  ├─ ShortcutHints (Tooltips in UI)                          │
│  └─ Command Palette (Enhanced with shortcuts)               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Context Detection
The system detects current context through:
1. **Route-based detection**: Current pathname determines module
2. **Component state**: Active form/edit mode vs. list/view mode
3. **Page type**: Dashboard, List, Detail, Form, Report

### 2.3 Shortcut Priority
```
Global Shortcuts (Highest Priority)
    ↓
Context-Specific Shortcuts (Module-aware)
    ↓
Page-Specific Shortcuts (Form/Detail aware)
```

---

## 3. Shortcut Definitions

### 3.1 Global Shortcuts (Always Available)

| Shortcut | Action | Handler Location | Notes |
|----------|--------|------------------|-------|
| `Ctrl+K` or `Cmd+K` | Open search/command palette | App.tsx | Already implemented |
| `Ctrl+/` or `Ctrl+?` | Show keyboard shortcuts help | KeyboardShortcutsContext | New |
| `Escape` | Close modals, dialogs, search | Global handler | Already partially implemented |
| `Ctrl+P` | Print current view | Global handler | New |

**Note on Browser Shortcuts:** The following browser shortcuts are NOT overridden to prevent conflicts:
- `Ctrl+F` - Browser native search (use `Ctrl+K` for app search instead)
- `Ctrl+N` - Browser new window (use `Alt+N` for new item)
- `Ctrl+W` - Browser close tab (use `Alt+W` for warehouses)
- `Ctrl+R` - Browser reload (use `Alt+R` for refresh)

### 3.2 Context-Aware Shortcuts

#### 3.2.1 Dashboard Context
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt+N` | Quick Add | Opens most relevant form based on recent activity |
| `Alt+R` | Refresh | Refreshes all dashboard widgets |

#### 3.2.2 Inventory Context
| Shortcut | Action | Target Route |
|----------|--------|--------------|
| `Alt+N` | Create New Item | `/inventory/items` (create mode) |
| `Alt+I` | Open Items List | `/inventory/items` |
| `Alt+W` | Open Warehouses | `/inventory/warehouses` |
| `Alt+M` | Stock Movements | `/inventory/stock-movements` |

#### 3.2.3 Sales Context
| Shortcut | Action | Target Route |
|----------|--------|--------------|
| `Alt+N` | Create New Invoice | `/sales/invoice` |
| `Alt+O` | Open POS Terminal | `/pos` |
| `Alt+C` | Open Customers | `/customers` |
| `Ctrl+S` | Save Current Invoice | (Form context) |

#### 3.2.4 Reports Context
| Shortcut | Action | Target Route |
|----------|--------|--------------|
| `Alt+N` | Generate New Report | `/reports` |
| `Alt+E` | Export Current Report | (Current report page) |
| `Alt+R` | Refresh Report Data | (Current report page) |

#### 3.2.5 General Context-Aware Actions
| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+S` | Save current form | Any form/edit page |
| `Alt+E` | Edit current item | Detail pages |
| `Alt+D` | Delete current item | Detail pages |
| `Alt+N` | Create new item | List pages |
| `Alt+B` | Back to list | Detail pages |

**Note:** `Alt` key is used instead of `Ctrl` for context actions to avoid browser conflicts.

### 3.3 Form-Specific Shortcuts

#### 3.3.1 Invoice/Order Forms
| Shortcut | Action |
|----------|--------|
| `Ctrl+I` | Add item to invoice |
| `Ctrl+C` | Add customer |
| `Ctrl+P` | Process payment |
| `Tab` | Navigate between fields |

#### 3.3.2 Item Forms
| Shortcut | Action |
|----------|--------|
| `Ctrl+U` | Upload image |
| `Ctrl+V` | View inventory levels |

---

## 4. Implementation Details

### 4.1 New Files

#### 4.1.1 `client/src/context/KeyboardShortcutsContext.tsx`
```typescript
interface KeyboardShortcut {
  id: string;
  key: string;
  action: string;
  context: string;
  handler: () => void;
  enabled?: () => boolean;
}

interface KeyboardShortcutsContextType {
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  getShortcutsForContext: (context: string) => KeyboardShortcut[];
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
}
```

#### 4.1.2 `client/src/components/common/KeyboardShortcutsHelp.tsx`
- Modal component showing all available shortcuts
- Organized by context (Global, Dashboard, Inventory, etc.)
- Searchable shortcut list
- Shows current context shortcuts highlighted

#### 4.1.3 `client/src/hooks/useKeyboardShortcut.ts`
```typescript
import { useEffect, useRef } from 'react';
import { useCurrentContext } from '../utils/contextDetection';
import { shouldIgnoreShortcut } from '../utils/inputGuard';

function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options?: { 
    context?: string; 
    enabled?: boolean | (() => boolean); // Support both value and function
    preventDefault?: boolean;
  }
): void {
  const handlerRef = useRef(handler);
  const enabledRef = useRef(options?.enabled);
  
  // Update refs on changes to avoid stale closures
  useEffect(() => {
    handlerRef.current = handler;
    enabledRef.current = options?.enabled;
  }, [handler, options?.enabled]);
  
  const currentContext = useCurrentContext();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if shortcut should be ignored (user typing in input)
      if (shouldIgnoreShortcut(event)) {
        return;
      }
      
      // Check context match
      if (options?.context && options.context !== currentContext) {
        return;
      }
      
      // Check if enabled
      const isEnabled = typeof enabledRef.current === 'function' 
        ? enabledRef.current() 
        : (enabledRef.current !== false); // Default to true if undefined
      
      if (!isEnabled) {
        return;
      }
      
      // Check key combination
      const isModKey = event.ctrlKey || event.metaKey;
      const isAltKey = event.altKey;
      const isShiftKey = event.shiftKey;
      
      // Parse key combination (e.g., "Ctrl+S", "Alt+N")
      const [modifier, targetKey] = key.split('+');
      
      let matches = false;
      if (modifier === 'Ctrl' && isModKey && event.key.toLowerCase() === targetKey.toLowerCase()) {
        matches = true;
      } else if (modifier === 'Alt' && isAltKey && event.key.toLowerCase() === targetKey.toLowerCase()) {
        matches = true;
      } else if (modifier === 'Shift' && isShiftKey && event.key.toLowerCase() === targetKey.toLowerCase()) {
        matches = true;
      } else if (!modifier && event.key === key) {
        matches = true;
      }
      
      if (matches) {
        if (options?.preventDefault !== false) {
          event.preventDefault();
        }
        handlerRef.current();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, options?.context, currentContext, options?.preventDefault]);
}
```

#### 4.1.4 `client/src/utils/shortcuts.ts`
- Shortcut registry management
- Context detection utilities
- Keyboard event handlers

### 4.2 Modified Files

#### 4.2.1 `client/src/App.tsx`
- Add `KeyboardShortcutsProvider` wrapper
- Register global shortcuts

#### 4.2.2 `client/src/components/layout/TopMenu.tsx`
- Add keyboard shortcut hints to menu items (tooltip)
- Add help button to user menu

#### 4.2.3 `client/src/components/layout/Sidebar.tsx`
- Add keyboard shortcut hints to nav items

#### 4.2.4 Page Components
- Register context-specific shortcuts in useEffect hooks
- Add form-specific shortcuts to form components

### 4.3 Context Detection Logic

**Important:** Context detection must use React Router hooks to ensure re-renders on navigation.

```typescript
// ContextDetection.ts
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
```

### 4.4 Input Guard Logic

**Critical:** Prevent shortcuts from firing when user is typing in input fields.

```typescript
// InputGuard.ts
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  const activeElement = document.activeElement;
  
  // Ignore if typing in input/textarea
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
```

---

## 5. User Interface Design

### 5.1 Keyboard Shortcuts Help Panel

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                    [X] Close    │
├─────────────────────────────────────────────────────┤
│  [Search shortcuts...]                              │
├─────────────────────┬───────────────────────────────┤
│  Global             │  Inventory                   │
│  • Ctrl+K - Search  │  • Ctrl+N - New Item         │
│  • Ctrl+/ - Help    │  • Ctrl+I - Items List       │
│  • Escape - Close   │  • Ctrl+W - Warehouses       │
├─────────────────────┼───────────────────────────────┤
│  Sales              │  Reports                     │
│  • Ctrl+N - Invoice │  • Ctrl+N - New Report       │
│  • Ctrl+O - POS     │  • Ctrl+E - Export           │
│  • Ctrl+C - Cust... │  • Ctrl+R - Refresh          │
└─────────────────────┴───────────────────────────────┘
```

### 5.2 UI Hints

**Menu Items:**
```
Dashboard  [Ctrl+1]
Inventory  [Ctrl+2]
  ├─ Items  [Ctrl+I]
  ├─ Warehouses [Ctrl+W]
  └─ ...
```

**Form Buttons:**
```
[Save] [Ctrl+S]    [Cancel] [Esc]
```

### 5.3 Command Palette Enhancements
- Show shortcut hints next to actions
- Fuzzy search for actions by name or shortcut
- Quick access to help panel

---

## 6. Accessibility Considerations

### 6.1 Visual Alternatives
- All shortcuts must have visible button/menu alternatives
- Screen reader announcements for shortcut actions
- High contrast mode support

### 6.2 Keyboard Navigation
- Tab navigation through all interactive elements
- Focus indicators for shortcut-activated elements
- Logical tab order

### 6.3 Screen Reader Support
- ARIA labels for shortcut hints
- Live regions for shortcut activation feedback
- Descriptive help panel structure

---

## 7. Testing Strategy

### 7.1 Unit Tests
- Shortcut registry functionality
- Context detection logic
- Handler registration/unregistration

### 7.2 Integration Tests
- Shortcut activation across different pages
- Conflict resolution (global vs context)
- Modal/help panel functionality

### 7.3 User Acceptance Testing
- Task completion time with vs without shortcuts
- Shortcut discovery rate
- User satisfaction surveys

---

## 8. Performance Considerations

### 8.1 Event Handling
- Use event delegation where possible
- Throttle rapid key presses
- Clean up event listeners properly

### 8.2 Memory Management
- Unregister shortcuts when components unmount
- Limit registry size (prevent memory leaks)
- Lazy load help panel content

### 8.3 AG-Grid Integration
Since Mini ERP uses AG-Grid for desktop data tables, shortcuts must not interfere with AG-Grid's native keyboard navigation:

**AG-Grid Keyboard Events to Preserve:**
- Arrow keys: Navigate cells
- Enter: Edit cell
- Tab: Move to next cell
- F2: Edit cell
- Delete: Clear cell
- Ctrl+C/V: Copy/Paste

**Implementation Strategy:**
1. Check if AG-Grid cell is focused before processing shortcuts
2. Use AG-Grid's `isCellEditing()` API to detect edit mode
3. Global shortcuts (Ctrl+K, Ctrl+?, Ctrl+P) work even in AG-Grid
4. Context shortcuts disabled when AG-Grid cell is being edited

```typescript
// AG-Grid Integration Helper
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
```

### 8.4 Mobile Considerations
- **Shortcuts Disabled on Mobile:** Keyboard shortcuts are only active on desktop (window.innerWidth > 768px)
- **Help Panel:** Hidden on mobile devices
- **Alternative UI:** Mobile users rely on tap interactions and bottom navigation

---

## 9. Rollout Plan

### 9.1 Phase 1: Foundation (Week 1)
- Implement KeyboardShortcutsContext
- Add global shortcuts (Ctrl+K, Ctrl+/, Escape)
- Create basic help panel

### 9.2 Phase 2: Context Shortcuts (Week 2)
- Add context detection
- Implement module-specific shortcuts
- Add UI hints

### 9.3 Phase 3: Polish (Week 3)
- Command palette enhancements
- Accessibility improvements
- User testing and feedback

### 9.4 Phase 4: Documentation (Week 4)
- User guide for keyboard shortcuts
- Developer documentation
- Release notes

---

## 10. Risks and Mitigations

### 10.1 Shortcut Conflicts
**Risk:** Browser or OS shortcuts conflict with app shortcuts
**Mitigation:** Use Ctrl/Cmd modifiers, provide user customization

### 10.2 User Confusion
**Risk:** Users overwhelmed by too many shortcuts
**Mitigation:** Gradual rollout, focus on most-used actions, help panel

### 10.3 Accessibility Issues
**Risk:** Shortcuts not accessible to all users
**Mitigation:** Ensure all actions have visual alternatives, test with screen readers

---

## 11. Success Metrics

- **Productivity:** 50% reduction in time for common actions
- **Adoption:** 80% of users discover 3+ shortcuts within first week
- **Satisfaction:** User satisfaction score > 4/5 for keyboard navigation
- **Accessibility:** WCAG 2.1 AA compliance for all shortcut features

---

## 12. Future Enhancements

### 12.1 User Customization
- Allow users to customize shortcut keybindings
- Preset profiles (Beginner, Advanced, Expert)
- Import/export shortcut configurations

### 12.2 Advanced Features
- Multi-key sequences (e.g., `g i` for go to items)
- Macros for complex workflows
- Shortcut suggestions based on usage patterns

### 12.3 Integration
- Browser extension for global shortcuts
- Mobile app shortcuts
- Voice command integration

---

## 13. References

- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Apple Human Interface Guidelines: Keyboard](https://developer.apple.com/design/human-interface-guidelines/keyboard)

---

**Document Status:** Ready for Review
**Next Step:** Spec review loop and user approval
