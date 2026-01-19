import { useState, useEffect } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return width < 769;
  });
  const [screenSize, setScreenSize] = useState<'small' | 'medium' | 'large'>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (width < 414) return 'small';
    if (width < 769) return 'medium';
    return 'large';
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;

      if (width < 414) {
        setIsMobile(true);
        setScreenSize('small');
      } else if (width < 769) {
        setIsMobile(true);
        setScreenSize('medium');
      } else {
        setIsMobile(false);
        setScreenSize('large');
      }
    };

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  return { isMobile, screenSize };
}