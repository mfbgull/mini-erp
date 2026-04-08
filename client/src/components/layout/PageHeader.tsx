import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  backTo?: string;
  showBackButton?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  children,
  backTo,
  showBackButton = true
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="page-header" style={{ alignItems: 'center' }}>
      <div className="header-left">
        {showBackButton && (
          <button className="back-btn" onClick={handleBack} type="button">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="page-title">
          <h1>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="header-actions">{children}</div>}
    </div>
  );
}
