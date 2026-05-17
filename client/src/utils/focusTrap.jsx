import React, { useEffect, useRef } from 'react';

// Very small, generic focus trap wrapper for desktop panels/grids.
// When active, it keeps focus inside the container and cycles with Tab/Shift+Tab.
export default function FocusTrap({ active, children, onDeactivate }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;

    const focusables = Array.from(
      el.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(n => !n.hasAttribute('disabled'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (first) first.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const activeEl = document.activeElement;
      if (!activeEl) return;
      if (e.shiftKey) {
        if (activeEl === first) {
          e.preventDefault();
          last && last.focus();
        }
      } else {
        if (activeEl === last) {
          e.preventDefault();
          first && first.focus();
        }
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [active]);

  if (!active) return <>{children}</>;
  return (
    <div ref={containerRef} aria-label="focus-trap" role="region">
      {children}
    </div>
  );
}
