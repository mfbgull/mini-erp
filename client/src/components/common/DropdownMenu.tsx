import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DropdownMenu.css';

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'start' | 'end';
}

export default function DropdownMenu({ trigger, items, align = 'end' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 140;
      
      let left = triggerRect.right - menuWidth;
      if (align === 'start') {
        left = triggerRect.left;
      }
      
      setPosition({
        top: triggerRect.bottom + 4,
        left: Math.max(8, left)
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      // Double check position after a short delay
      const timer = setTimeout(updatePosition, 50);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        clearTimeout(timer);
      };
    }
  }, [isOpen, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuContent = isOpen && (
    <div 
      className={`dropdown-menu-content ${align === 'end' ? 'align-end' : 'align-start'}`}
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 99999
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={`dropdown-menu-item ${item.className || ''} ${item.destructive ? 'destructive' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick?.();
            setIsOpen(false);
          }}
        >
          <span className="dropdown-menu-item-icon">
            {item.icon}
          </span>
          <span className="dropdown-menu-item-label">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div 
        ref={triggerRef}
        className="dropdown-menu-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {trigger}
      </div>
      {createPortal(menuContent, document.body)}
    </>
  );
}