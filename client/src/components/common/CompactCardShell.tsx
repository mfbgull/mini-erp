import { useState, useEffect, useCallback } from 'react';
import { MoreVertical, X } from 'lucide-react';
import Card from './Card';

export interface CompactCardMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'danger';
}

export interface CompactCardShellProps {
  className?: string;
  children: React.ReactNode;
  menuItems?: CompactCardMenuItem[];
  detailContent?: React.ReactNode;
  detailTitle?: string;
  onClick?: () => void;
}

export function CompactCardShell({
  className = '',
  children,
  menuItems = [],
  detailContent,
  detailTitle,
  onClick,
}: CompactCardShellProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleCardClick = useCallback(() => {
    if (detailContent) {
      setShowDetails(true);
    }
    onClick?.();
  }, [detailContent, onClick]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }, []);

  const handleBackdropClick = useCallback(() => {
    setShowMenu(false);
  }, []);

  useEffect(() => {
    if (!showDetails) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDetails(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDetails]);

  return (
    <>
      <Card variant="compact" hoverable onClick={handleCardClick} className={className}>
        <div className="card-content-clickable">
          {children}

          {menuItems.length > 0 && (
            <div className="menu-container" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="menu-trigger" onClick={handleMenuToggle}>
                <MoreVertical className="menu-icon" />
              </button>

              {showMenu && (
                <>
                  <div className="menu-backdrop" onClick={handleBackdropClick} />
                  <div className="dropdown-menu">
                    {menuItems.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`dropdown-item ${item.variant === 'danger' ? 'dropdown-item-danger' : ''}`}
                        onClick={() => {
                          setShowMenu(false);
                          item.onClick();
                        }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {showDetails && detailContent && (
        <div className="card-detail-overlay" onClick={() => setShowDetails(false)}>
          <div className="card-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-detail-header">
              <h3>{detailTitle || 'Details'}</h3>
              <button type="button" className="card-detail-close" onClick={() => setShowDetails(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="card-detail-body">
              {detailContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
