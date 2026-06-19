import { useEffect, useRef } from 'react';

import { useKeyboardShortcuts } from '../context/KeyboardShortcutsContext';
import { useCurrentContext } from '../utils/contextDetection';

interface UseKeyboardShortcutOptions {
  context?: string;
  enabled?: boolean;
  id?: string;
  label?: string;
}

function idToLabel(id: string): string {
  return id
    .replace(/^[a-z]+-/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: UseKeyboardShortcutOptions = {}
): void {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();
  const handlerRef = useRef(handler);
  const currentContext = useCurrentContext();
  
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const shortcutId = options.id || `${options.context || currentContext}-${key}`;
    
    const shortcut = {
      id: shortcutId,
      key,
      label: options.label || idToLabel(shortcutId),
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
