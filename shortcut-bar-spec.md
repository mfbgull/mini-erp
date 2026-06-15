# Shortcut Bar — Specification

## Overview

Add a narrow, fixed-position bar at the bottom of the viewport (desktop only) that displays the keyboard shortcuts available on the current page (left side) plus a curated set of global shortcuts (right side). Integrate the existing FloatingActionButton's Quick Actions trigger into the bar on desktop; keep the floating FAB on mobile where the bar is hidden.

---

## 1. Positioning & Layout

| Property | Value |
|----------|-------|
| Position | `fixed` to viewport bottom |
| Width | `100%` (full viewport width) |
| Height | `~36px` |
| Z-index | `100` (above content, below modals/overlays which are at `z-index: 1000`) |
| Display | Only on `min-width: 769px` (desktop/tablet landscape) |
| Hidden | On screens `<769px` (mobile) |

### Layout structure (left → right):

```
[Quick Actions icon]  [Alt+N  New record]  [Alt+I  Search]  [Alt+W  Warehouses]  |  [Esc  Close]  [Ctrl+S  Save]  [Ctrl+K  Search]  [Ctrl+/  Help]  [✕ dismiss]
 ^-- left section (page shortcuts)                                                     ^-- right section (global shortcuts)                      ^-- dismiss
```

- **Left section**: Dynamic list of page-specific shortcuts from `KeyboardShortcutsContext`
- **Right section**: Fixed list of global shortcuts (always visible on desktop)
- **Dismiss button**: Small ✕ button at the far right end to toggle the bar off

---

## 2. Content & Data Source

### Page shortcuts (left side)

Read dynamically from `KeyboardShortcutsContext.getShortcutsForContext(currentContext)`.

- Display ALL shortcuts registered for the current page context that have `enabled !== false`
- Format: `"<key combo>  <action label>"` — key first, then action description
  - Example: `"Alt+N  New record"`
- If a page has no registered shortcuts, the left section shows nothing (or a short text like "No shortcuts")
- Shortcuts are rendered as inline pill/chip elements

### Global shortcuts (right side)

Always display the following global shortcuts (hardcoded list):

| Shortcut | Action | Source |
|----------|--------|--------|
| `Esc` | Close modal | Handled browser-wide |
| `Ctrl+S` | Save | Registered in form contexts |
| `Ctrl+K` | Search | Registered in `App.tsx` (`handleKeyDown`) |
| `Ctrl+/` | Shortcuts help | Registered in `KeyboardShortcutsContext` |
| `Alt+N` | New record | Registered on most list pages |

These should be shown even if no shortcuts are registered for the current page context (they form a minimum baseline).

### Dynamic filtering

- When a page shortcut's `id` or `key` matches one of the global shortcuts, deduplicate (show it only once, on the right)
- On pages where the user is in an input field and `shouldIgnoreShortcut()` returns `true`, the bar content stays the same (always visible)

---

## 3. Design & Styling

### Visual style: "Modern pill/chip bar"

- Height: `~36px`
- Background: Use CSS variable `--surface-secondary` or a subtle `--bg-secondary` with a top border `1px solid var(--border-color)`
- Font size: `12px` (small, monospace for key combos)
- Each shortcut is rendered as a **pill/chip**:
  - Padding: `2px 8px`
  - Border radius: `4px`
  - The key combo part: `font-family: monospace`, bold, `background: var(--neutral-100)` (like `<kbd>` styling)
  - The action text: normal weight, slightly muted color (`var(--text-secondary)`)
- Divider between left and right sections: subtle vertical line `1px solid var(--border-color)`
- Dismiss button: small `✕` icon button, `opacity: 0.5` → `1` on hover, title "Hide shortcuts"
- Theme: Use existing CSS variables (`--bg-primary`, `--text-primary`, `--border-color`, `--neutral-100`, etc.) so it adapts to light/dark mode automatically
- Transitions: `opacity 0.2s`, `background-color 0.2s` for smooth theme switching

### CSS Variables reference (from existing codebase):

```css
--bg-primary:    main background
--text-primary:  main text
--text-secondary:muted text
--border-color:  borders/dividers
--neutral-100:   light gray for kbd backgrounds
--card-bg:       card background
```

---

## 4. Component Architecture

### New files to create:

```
client/src/components/layout/ShortcutBar.tsx         — Main component
client/src/components/layout/ShortcutBar.css          — Styles
```

### Existing files to modify:

| File | Change |
|------|--------|
| `client/src/App.tsx` | Add `<ShortcutBar />` inside `AppLayout` (below `<div className="content">` or after the routes) |
| `client/src/components/layout/FloatingActionButton.css` | Change `position: fixed` to `position: fixed` but only visible on mobile; hide FAB on desktop |
| `client/src/components/layout/FloatingActionButton.tsx` | Consider adding Quick Actions trigger into the ShortcutBar |
| `client/src/pages/Dashboard.jsx` | Fix the shortcut `action` string for the bar display (see data flow note) |
| `client/src/locales/en.json` | Add i18n keys for shortcut descriptions |
| `client/src/locales/ur.json` | Add Urdu translations for shortcut descriptions |

### Component state:

```typescript
interface ShortcutBarProps {
  // No props needed — reads from context directly
}
```

### Internal state:

- `isDismissed: boolean` — persists via `localStorage` key `'shortcutBarDismissed'`
- `currentContext: string` — from `useCurrentContext()` hook

### Data flow:

1. `ShortcutBar` calls `useKeyboardShortcuts()` to get `getShortcutsForContext`
2. Calls `useCurrentContext()` to get the current page context string
3. Fetches shortcuts: `getShortcutsForContext(context)` for page section
4. Fetches globals: `getShortcutsForContext('global')` + hardcoded extras
5. Renders pills sorted by key combo alphabetically or by registration order

### Data quality concern:

The existing `KeyboardShortcut` interface has an `action: string` field that currently stores the **handler function's `.toString()`** — not a human-readable label. The spec doesn't require fixing this in phase 1, but **we need to add a `label: string` field** to the `KeyboardShortcut` interface so the bar can display readable labels. If `label` is missing, fall back to a generated label from the `id` field (e.g., `"inventory-new-item"` → `"New item"`).

**Plan for label fallback:**
- Add optional `label: string` to `KeyboardShortcut` interface in `KeyboardShortcutsContext.tsx`
- Update `useKeyboardShortcut` options to accept a `label` field
- In pages that register shortcuts, add a human-readable `label` (e.g., `"New record"`, `"Search items"`, etc.)
- Fallback: auto-generate label from `id` by replacing hyphens with spaces and capitalizing

---

## 5. FAB Integration

| Platform | Behavior |
|----------|----------|
| Desktop | Floating FAB is **hidden**. The Quick Actions button moves to the **left edge of the ShortcutBar** (a `+` or grid icon button). Clicking it opens the Quick Actions panel (same as current FAB click). |
| Mobile | Floating FAB remains **as-is** (since the ShortcutBar is hidden). |
## 5. FAB Integration (Detailed)

### 5.1 Platform Split Summary

| Platform | ShortcutBar | Floating FAB | Quick Actions access |
|----------|-------------|--------------|---------------------|
| Desktop (≥769px) | **Shown** | **Hidden** | Via a dedicated button on the ShortcutBar's left edge |
| Mobile (<769px) | **Hidden** | **Shown** (unchanged) | Via the floating FAB button (unchanged) |

### 5.2 Anatomy of the FAB → ShortcutBar migration

There are currently **two places** that render `<FloatingActionButton />`:

| File | Line | Role |
|------|------|------|
| `client/src/App.tsx` (inside `AppLayout`) | ~253 | Renders the FAB on every authenticated page **except** Dashboard (which has its own) |
| `client/src/pages/Dashboard.jsx` | ~254 | Renders its own FAB (identical component) |

Both will get the same treatment: on desktop the floating button is hidden and Quick Actions moves to the bar.

### 5.3 FAB component CSS changes

**File:** `client/src/components/layout/FloatingActionButton.css`

Current state: `.fab` has `position: fixed;` visible on all screens.

Required changes:

```css
/* Current — keep as-is for mobile */
.fab {
  position: fixed;
  bottom: 12px;
  right: 12px;
  width: 56px;
  height: 56px;
  border-radius: 10%;
  background: var(--primary-500, var(--info, #3b82f6));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  z-index: 1000;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

/* NEW: Hide FAB on desktop — ShortcutBar replaces it */
@media (min-width: 769px) {
  .fab {
    display: none;
  }
}
```

This single CSS change is enough — the `FloatingActionButton.tsx` component itself stays unchanged. It will still render on desktop but be invisible. On mobile it works exactly as today.

### 5.4 The Quick Actions button on the ShortcutBar

**Position:** First element in the left section (before page shortcuts).

**Icon:** `LayoutGrid` (grid/dots icon from lucide-react, 16px) to visually distinguish it from keyboard shortcut pills.

**Visual treatment:** Slightly elevated compared to shortcut pills to indicate "this is a trigger, not a label":

```css
.shortcut-bar-quick-actions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: var(--primary-500, #3b82f6);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  margin: 0 8px 0 4px;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.15s;
}

.shortcut-bar-quick-actions-btn:hover {
  background: var(--primary-700, #1d4ed8);
  transform: scale(1.05);
}

.shortcut-bar-quick-actions-btn:active {
  transform: scale(0.95);
}

.shortcut-bar-quick-actions-btn:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

**Tooltip:** Title attribute "Quick actions" (i18n key: `shortcuts.quickActions`).

**Keyboard accessible:** The button is focusable and can be activated via Enter/Spacebar.

### 5.5 State management for the Quick Actions panel

**Current architecture:**
- `FloatingActionButton.tsx` owns `isPanelOpen` state locally as `useState(false)`
- Passes `isPanelOpen` and `onClose` to `<QuickActionsPanel>`
- On mobile, the panel is a bottom sheet with backdrop
- On desktop, the panel is a floating card at `bottom: 80px; right: 24px`

**New architecture for desktop:**

The `ShortcutBar` component needs to own the `isPanelOpen` state, because both the ShortcutBar button and the QuickActionsPanel need to share it.

```tsx
// Inside ShortcutBar.tsx:
const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

return (
  <>
    <div className="shortcut-bar">
      <div className="shortcut-bar-left">
        <button
          className="shortcut-bar-quick-actions-btn"
          onClick={() => setIsQuickActionsOpen(true)}
          title={t('shortcuts.quickActions')}
          aria-label={t('shortcuts.quickActions')}
          aria-haspopup="dialog"
          aria-expanded={isQuickActionsOpen}
        >
          <LayoutGrid size={16} />
        </button>
        {/* shortcut pills ... */}
      </div>
      <div className="shortcut-bar-right">
        {/* global shortcuts ... */}
      </div>
    </div>

    {/* Render QuickActionsPanel above the bar */}
    <QuickActionsPanel
      isOpen={isQuickActionsOpen}
      onClose={() => setIsQuickActionsOpen(false)}
    />
  </>
);
```

> **Note:** `QuickActionsPanel` already supports both mobile and desktop layouts internally (via `useMediaQuery`). On desktop, its backdrop uses `bottom: 80px; right: 24px` — this will need updating (see §5.6).

### 5.6 QuickActionsPanel desktop layout anchor change

**Problem:** The current `QuickActionsPanel.css` desktop layout positions the panel at `bottom: 80px; right: 24px` — this was designed to float above the old FAB (which was at `bottom: 12px; right: 12px`). Now on desktop, there is no FAB, but there IS a ShortcutBar at the very bottom.

**Fix needed in `QuickActionsPanel.css`:**

Currently the desktop layout uses `bottom: 80px` (for the FAB + gap). This needs to change to position the panel **above the ShortcutBar**.

```css
/* CURRENT — positions above the old FAB */
.quick-actions-backdrop.desktop-layout {
  /* ... */
  bottom: 80px;  /* 👈 Change this */
  right: 24px;
  /* ... */
}

.quick-actions-panel.desktop-layout {
  /* ... */
  bottom: 70px;  /* 👈 Change this too */
  right: 0;
  /* ... */
}
```

**Updated values (to position above ShortcutBar):**

Change both `.quick-actions-backdrop.desktop-layout` and `.quick-actions-panel.desktop-layout` to use a new approach: remove the fixed bottom offsets and instead rely on a wrapping container, OR change the offset to account for the ShortcutBar height (~36px) + a gap:

Option A (simplest — change the offset):
```css
.quick-actions-backdrop.desktop-layout {
  bottom: calc(36px + 16px);  /* 36px ShortcutBar + 16px gap */
  right: 24px;
}

.quick-actions-panel.desktop-layout {
  bottom: calc(36px + 8px);   /* 36px ShortcutBar + 8px gap */
  right: 0;
}
```

Option B (cleaner — change to `position: fixed` with `top: auto`):
```css
.quick-actions-backdrop.desktop-layout {
  position: fixed;
  bottom: calc(36px + 12px); /* sits above the ShortcutBar */
  right: 24px;
  width: 400px;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  background: var(--card-bg, #fff);
  display: block;
}
```

### 5.7 Existing QuickActionsPanel usages affected

| Usage | File | Impact |
|-------|------|--------|
| `FloatingActionButton.tsx` | Triggers on both mobile & desktop → now only triggers on mobile (hidden on desktop) | No code change needed — CSS hides the FAB on desktop, so the panel simply won't open from this path on desktop |
| `StockMovementPage.jsx` (mobile) | Has its own `QuickActionsPanel` trigger on **mobile only** | No impact — this usage is in a `{isMobile && (...)}` block, so it never renders on desktop anyway |

### 5.8 Edge Cases for the FAB integration

1. **Dashboard has its own FAB:** The Dashboard renders `<FloatingActionButton />` directly. On desktop, this FAB will also be hidden (via the same CSS media query). The ShortcutBar is rendered at the AppLayout level once, so it appears on Dashboard too. No Dashboard-specific changes needed for the bar itself.

2. **Quick Actions panel animating from the wrong position:** The panel's desktop backdrop currently uses `.quick-actions-backdrop.desktop-layout` which fills nothing (it's `position: fixed` with only `bottom`/`right` set). When the anchor changes (from above-FAB to above-bar), the panel will naturally animate from the new position.

3. **Z-index layering:**
   - ShortcutBar: `z-index: 100`
   - QuickActionsPanel backdrop: `z-index: 1001`
   - QuickActionsPanel content: `z-index: 1002`
   - The panel floats above the bar, so the panel's `z-index` is higher. On close, the panel disappears, revealing the bar behind it.

4. **No flash of FAB on page load:** Since the CSS media query hides `.fab` on desktop, the FAB never appears on desktop even during React hydration/initial render.

5. **If the ShortcutBar is dismissed (✕ button), the Quick Actions button goes away too:** On desktop, dismissing the bar means no Quick Actions access. Users would need to re-enable the bar in Settings to get it back. For phase 1, there's no recovery button — the bar dismissal is permanent until `localStorage` is cleared.

---

## 6. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `<769px` (mobile) | ShortcutBar hidden; FAB visible and works as today |
| `≥769px` (desktop) | ShortcutBar visible; FAB hidden; Quick Actions accessible from bar |

No collapsible or mini mode — it's either full bar or hidden.

---

## 7. Dismissal & Persistence

- A small ✕ dismiss button at the far right of the bar
- On click: hide the bar and save `localStorage.setItem('shortcutBarDismissed', 'true')`
- On page load: check `localStorage` — if dismissed, don't render the bar
- **No way to re-show the bar from within the UI** (unless user clears localStorage or we add a toggle in Settings). Consider adding a "Show shortcut bar" toggle in Settings in a future iteration.

---

## 8. i18n

Add new i18n keys for shortcut labels:

```json
{
  "shortcuts": {
    "barTitle": "Shortcuts",
    "newRecord": "New record",
    "searchItems": "Search items",
    "goToWarehouses": "Warehouses",
    "search": "Search",
    "help": "Shortcuts help",
    "save": "Save",
    "closeModal": "Close modal",
    "dismissBar": "Hide shortcut bar",
    "quickActions": "Quick actions",
    "noShortcuts": "No shortcuts for this page"
  }
}
```

---

## 9. Implementation Order

1. Add `label` field to `KeyboardShortcut` interface and `useKeyboardShortcut` options (with fallback generation)
2. Create `ShortcutBar.css` with styles
3. Create `ShortcutBar.tsx` component
4. Integrate `ShortcutBar` into `AppLayout` in `App.tsx`
5. Update `FloatingActionButton.css` to hide FAB on desktop
6. Pass Quick Actions trigger into ShortcutBar
7. Update all pages that register shortcuts to include a human-readable `label`
8. Add i18n keys
9. Test on all major page types (list pages, detail pages, forms, dashboard)
10. Verify dark/light theme adaptation

---

## 10. Edge Cases & Considerations

- **Empty state**: If page has zero shortcuts registered, only show global section
- **Overflow**: If many shortcuts exist (unlikely but possible), the left section should scroll horizontally (`overflow-x: auto`, `flex-shrink: 0` on pills)
- **AG-Grid conflict**: AG-Grid has its own keyboard handling. The bar should not interfere since it's purely informational
- **Performance**: No re-renders on every keystroke — only on context changes (route changes) or shortcut registration changes
- **Shortcut description quality**: Some existing shortcuts store `handler.toString()` as the `action` field. These will show garbage unless we add proper `label` fields
