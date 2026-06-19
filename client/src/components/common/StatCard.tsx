import { memo, ReactNode, CSSProperties } from 'react';

import type { LucideIcon } from 'lucide-react';
import '../../styles/components/stat-card.css';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  subtitle?: string;
  alert?: boolean;
  style?: CSSProperties;
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  alert = false,
  style,
}: StatCardProps) {
  return (
    <div className={`stat-card${alert ? ' alert' : ''}`} style={style}>
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
});

interface StatsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const StatsGrid = memo(function StatsGrid({ children, columns, className = '' }: StatsGridProps) {
  const style = columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined;
  return <div className={`stats-grid ${className}`.trim()} style={style}>{children}</div>;
});

export default StatCard;
export { StatsGrid };
export type { StatCardProps, StatsGridProps };
