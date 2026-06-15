import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { LayoutGrid, X } from 'lucide-react';

import { useCurrentContext } from '../../utils/contextDetection';
import { useKeyboardShortcuts } from '../../context/KeyboardShortcutsContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import QuickActionsPanel from './QuickActionsPanel';
import './ShortcutBar.css';

/** Shortcut entry for display in the bar */
interface DisplayShortcut {
  key: string;
  label: string;
  id: string;
}

/** Hardcoded global shortcuts always shown on the right */
const GLOBAL_SHORTCUTS: DisplayShortcut[] = [
  { key: 'Esc',     label: 'Close modal',    id: 'global-esc' },
  { key: 'Ctrl+S',  label: 'Save',           id: 'global-ctrl-s' },
  { key: 'Ctrl+K',  label: 'Search',         id: 'global-ctrl-k' },
  { key: 'Ctrl+/',  label: 'Shortcuts help', id: 'global-ctrl-slash' },
  { key: 'Alt+N',   label: 'New record',     id: 'global-alt-n' },
  { key: 'Ctrl+Shift+B', label: 'Toggle bar', id: 'global-toggle-bar' },
];

/** Keys that should be deduplicated (show only on right side) */
const GLOBAL_KEYS = new Set(GLOBAL_SHORTCUTS.map(s => s.key.toLowerCase()));

export default function ShortcutBar() {
  const { getShortcutsForContext } = useKeyboardShortcuts();
  const currentContext = useCurrentContext();
  const { t } = useTranslation();

  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('shortcutBarDismissed') === 'true';
  });

  // Listen for storage changes (cross-tab) + custom same-tab storage events
  // so the bar hides/shows immediately when toggled from Settings.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'shortcutBarDismissed') {
        setIsDismissed(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Toggle shortcut bar visibility with Ctrl+Shift+B
  const toggleBar = () => {
    const currentlyDismissed = localStorage.getItem('shortcutBarDismissed') === 'true';
    const newValue = currentlyDismissed ? 'false' : 'true';
    const oldValue = currentlyDismissed ? 'true' : 'false';
    setIsDismissed(!currentlyDismissed);
    localStorage.setItem('shortcutBarDismissed', newValue);
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'shortcutBarDismissed',
      newValue,
      oldValue,
      storageArea: localStorage,
    }));
  };

  useKeyboardShortcut('Ctrl+Shift+B', toggleBar, {
    context: 'global',
    id: 'toggle-shortcut-bar',
    label: 'Toggle shortcut bar',
  });

  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  /** Build page shortcut pills (excludes globals to avoid dupes) */
  const pageShortcuts = useMemo<DisplayShortcut[]>(() => {
    const raw = getShortcutsForContext(currentContext);
    return raw
      .filter(s => s.enabled !== false && !GLOBAL_KEYS.has(s.key.toLowerCase()))
      .map(s => ({
        key: s.key,
        label: s.label,
        id: s.id,
      }));
  }, [getShortcutsForContext, currentContext]);

  /** No shortcuts and dismissed → render nothing at all */
  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="shortcut-bar" role="toolbar" aria-label="Keyboard shortcuts">
        {/* ── Left section: Quick Actions button + page shortcuts ── */}
        <div className="shortcut-bar-left">
          <button
            className="shortcut-bar-qa-btn"
            onClick={() => setIsQuickActionsOpen(true)}
            title={t('shortcuts.quickActions') || 'Quick actions'}
            aria-label={t('shortcuts.quickActions') || 'Quick actions'}
            aria-haspopup="dialog"
            aria-expanded={isQuickActionsOpen}
            type="button"
          >
            <LayoutGrid size={16} />
          </button>

          {pageShortcuts.length === 0 && (
            <span className="shortcut-bar-pill" style={{ opacity: 0.5 }}>
              <span className="shortcut-label">{t('shortcuts.noShortcuts') || 'No shortcuts'}</span>
            </span>
          )}

          {pageShortcuts.map(s => (
            <span key={s.id} className="shortcut-bar-pill" title={`${s.key} — ${s.label}`}>
              <kbd>{s.key}</kbd>
              <span className="shortcut-label">{s.label}</span>
            </span>
          ))}
        </div>

        {/* ── Divider ── */}
        {pageShortcuts.length > 0 && <div className="shortcut-bar-divider" />}

        {/* ── Right section: global shortcuts + dismiss ── */}
        <div className="shortcut-bar-right">
          {GLOBAL_SHORTCUTS.map(s => (
            <span key={s.id} className="shortcut-bar-pill" title={`${s.key} — ${s.label}`}>
              <kbd>{s.key}</kbd>
              <span className="shortcut-label">{s.label}</span>
            </span>
          ))}

          <button
            className="shortcut-bar-dismiss"
            onClick={() => {
              setIsDismissed(true);
              localStorage.setItem('shortcutBarDismissed', 'true');
            }}
            title={t('shortcuts.dismissBar') || 'Hide shortcut bar'}
            aria-label={t('shortcuts.dismissBar') || 'Hide shortcut bar'}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Quick Actions panel (floats above the bar) */}
      <QuickActionsPanel
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
      />
    </>
  );
}
