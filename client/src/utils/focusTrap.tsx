import { useEffect, useRef, ReactNode } from 'react';

interface FocusTrapProps {
  active: boolean;
  children: ReactNode;
}

export default function FocusTrap({ active, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    const focusables = Array.from(
      el.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(n => !n.hasAttribute('disabled'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (first) first.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const activeEl = document.activeElement;
      if (!activeEl) return;
      if (e.shiftKey) {
        if (activeEl === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (activeEl === last) { e.preventDefault(); first?.focus(); }
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [active]);

  if (!active) return <>{children}</>;
  return <div ref={containerRef} aria-label="focus-trap" role="region">{children}</div>;
}
