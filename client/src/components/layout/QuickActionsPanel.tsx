import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FilePlus2,
  ShoppingCart,
  Warehouse,
  UserPlus,
  PackagePlus,
  BarChart3,
  CreditCard,
  Scale
} from 'lucide-react';
import './QuickActionsPanel.css';

interface QuickActionItem {
  id: string;
  label: string;
  icon: JSX.Element;
  path?: string;
  onClick?: () => void;
}

interface QuickActionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hook to detect screen size
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export default function QuickActionsPanel({ isOpen, onClose }: QuickActionsPanelProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isAnimating, setIsAnimating] = useState(false);

  // Define the 9 quick actions
  const quickActions: QuickActionItem[] = [
    {
      id: 'create-invoice',
      label: 'Create Invoice',
      icon: <FileText size={24} />,
      path: '/sales/invoice'
    },
    {
      id: 'guided-invoice',
      label: '5-Step Invoice',
      icon: <FilePlus2 size={24} />,
      path: '/invoices/create'
    },
    {
      id: 'create-purchase',
      label: 'Create Purchase',
      icon: <ShoppingCart size={24} />,
      path: '/purchase-orders/create'
    },
    {
      id: 'create-warehouse',
      label: 'Create Warehouse',
      icon: <Warehouse size={24} />,
      path: '/inventory/warehouses'
    },
    {
      id: 'create-customer',
      label: 'Create Customer',
      icon: <UserPlus size={24} />,
      path: '/customers'
    },
    {
      id: 'create-product',
      label: 'Create Product',
      icon: <PackagePlus size={24} />,
      path: '/inventory/items'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 size={24} />,
      path: '/reports'
    },
    {
      id: 'create-payment',
      label: 'Create Payment',
      icon: <CreditCard size={24} />,
      path: '/sales'
    },
    {
      id: 'stock-adjustment',
      label: 'Stock Adj.',
      icon: <Scale size={24} />,
      path: '/inventory/stock-movements'
    }
  ];

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle swipe gestures for mobile
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isSwiping = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isSwiping = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping || !panelRef.current) return;

      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) { // Swiping down
        panelRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping || !panelRef.current) return;

      const deltaY = currentY - startY;
      if (deltaY > 50) { // If swiped down more than 50px
        onClose();
      } else {
        // Reset position
        panelRef.current.style.transform = 'translateY(0)';
      }

      isSwiping = false;
    };

    if (isOpen && isMobile) { // Only on mobile
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onClose, isMobile]);

  const handleActionClick = (action: QuickActionItem) => {
    if (action.path) {
      navigate(action.path);
    } else if (action.onClick) {
      action.onClick();
    }
    onClose(); // Close the panel after action
  };

  if (!isOpen) return null;

  return (
    <div
      className={`quick-actions-backdrop ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}
      onClick={isMobile ? onClose : undefined}
    >
      <div
        ref={panelRef}
        className={`quick-actions-panel ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-actions-title"
      >
        <div className="panel-header">
          <h3 id="quick-actions-title">Quick Actions</h3>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close quick actions menu"
          >
            ×
          </button>
        </div>

        <div className={`actions-grid ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`action-item ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}
              onClick={() => handleActionClick(action)}
              aria-label={action.label}
            >
              <div className={`action-icon ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>{action.icon}</div>
              <div className={`action-label ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>{action.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}