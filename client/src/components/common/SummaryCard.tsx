import { memo, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import '../../styles/components/summary-card.css';

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const SummaryCard = memo(function SummaryCard({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = 'default',
  className = '',
}: SummaryCardProps) {
  return (
    <div className={`summary-card${variant !== 'default' ? ` ${variant}` : ''}${className ? ` ${className}` : ''}`}>
      <div className="summary-icon">
        <Icon size={24} />
      </div>
      <div className="summary-content">
        <div className="summary-value">{value}</div>
        <div className="summary-label">{label}</div>
        {subtitle && <div className="summary-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
});

interface SummaryGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const SummaryGrid = memo(function SummaryGrid({
  children,
  columns,
  className = '',
}: SummaryGridProps) {
  const style = columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined;
  return (
    <div className={`summary-grid ${className}`.trim()} style={style}>
      {children}
    </div>
  );
});

export default SummaryCard;
export { SummaryGrid };
export type { SummaryCardProps, SummaryGridProps };
