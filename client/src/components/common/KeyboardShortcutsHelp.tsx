import { useState } from 'react';

import { X, Search } from 'lucide-react';

import { useKeyboardShortcuts } from '../../context/KeyboardShortcutsContext';
import './KeyboardShortcutsHelp.css';

export function KeyboardShortcutsHelp() {
  const { isHelpOpen, hideHelp, getShortcutsForContext } = useKeyboardShortcuts();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isHelpOpen) return null;

  const contexts = ['global', 'dashboard', 'inventory', 'sales', 'reports', 'purchases', 'forecasts'];
  
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
                      <span className="shortcut-label">{shortcut.label}</span>
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
