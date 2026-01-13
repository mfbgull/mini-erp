import { useSettings } from '../../../context/SettingsContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import '../MobileInvoice.css';

interface StickyFooterProps {
  subtotal: number;
  total: number;
  paid: number;
  balance: number;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  showBack?: boolean;
}

export default function StickyFooter({ 
  subtotal, 
  total, 
  paid, 
  balance,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  showBack = true
}: StickyFooterProps) {
  const { formatCurrency } = useSettings();

  return (
    <div className="miw-sticky-footer">
      {/* Summary Row - 4 columns */}
      <div className="miw-footer-summary">
        <div className="miw-footer-col">
          <span className="miw-footer-label">Subtotal</span>
          <span className="miw-footer-value">{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="miw-footer-divider" />
        
        <div className="miw-footer-col">
          <span className="miw-footer-label">Total</span>
          <span className="miw-footer-value miw-footer-total">{formatCurrency(total)}</span>
        </div>
        
        <div className="miw-footer-divider" />
        
        <div className="miw-footer-col">
          <span className="miw-footer-label">Paid</span>
          <span className="miw-footer-value">{formatCurrency(paid)}</span>
        </div>
        
        <div className="miw-footer-divider" />
        
        <div className="miw-footer-col">
          <span className="miw-footer-label">Balance</span>
          <span className={`miw-footer-value ${balance > 0 ? 'balance-due' : 'balance-paid'}`}>
            {formatCurrency(Math.abs(balance))}
          </span>
        </div>
      </div>
      
      {/* Button Row */}
      <div className="miw-footer-buttons">
        {showBack && onBack && (
          <button className="miw-btn-secondary" onClick={onBack}>
            <ArrowLeft size={18} />
            Back
          </button>
        )}
        
        {onContinue && (
          <button className="miw-btn-primary" onClick={onContinue}>
            {continueLabel}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
