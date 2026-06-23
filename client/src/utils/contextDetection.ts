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
