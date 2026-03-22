import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => {
      if (prev.find(s => s.id === shortcut.id)) {
        return prev.map(s => s.id === shortcut.id ? shortcut : s);
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  const getShortcutsForContext = useCallback((context: string) => {
    return shortcuts.filter(s => s.context === context && s.enabled !== false);
  }, [shortcuts]);

  const showHelp = useCallback(() => setIsHelpOpen(true), []);
  const hideHelp = useCallback(() => setIsHelpOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && (event.key === '/' || event.key === '?')) {
        event.preventDefault();
        setIsHelpOpen(prev => !prev);
        return;
      }

      if (event.key === 'Escape' && isHelpOpen) {
        event.preventDefault();
        setIsHelpOpen(false);
        return;
      }

      const globalShortcuts = getShortcutsForContext('global');
      for (const shortcut of globalShortcuts) {
        if (matchesShortcut(event, shortcut.key)) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }

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
    showHelp,
    hideHelp,
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
