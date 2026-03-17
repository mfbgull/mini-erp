import { ReactNode, memo } from 'react';
import '../../styles/components/card.css';

type CardVariant = 'default' | 'compact' | 'mobile' | 'border-accent' | 'gradient';
type CardSize = 'small' | 'medium' | 'large';
type CardPadding = 'none' | 'small' | 'medium' | 'large';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  selected?: boolean;
}

interface CardHeaderProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'space-between';
}

interface CardMediaProps {
  src: string;
  alt?: string;
  className?: string;
  overlay?: ReactNode;
}

interface CardRowProps {
  children: ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: 'none' | 'small' | 'medium' | 'large';
}

interface CardColumnProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: 'none' | 'small' | 'medium' | 'large';
}

const CardHeader = memo(function CardHeader({
  children,
  className = '',
  title,
  subtitle,
  icon,
  action
}: CardHeaderProps) {
  return (
    <div className={`card-header ${className}`}>
      {icon && <div className="card-header-icon">{icon}</div>}
      <div className="card-header-content">
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
});

const CardBody = memo(function CardBody({
  children,
  className = '',
  scrollable = false
}: CardBodyProps) {
  return (
    <div className={`card-body ${scrollable ? 'card-body-scrollable' : ''} ${className}`}>
      {children}
    </div>
  );
});

const CardFooter = memo(function CardFooter({
  children,
  className = '',
  align = 'left'
}: CardFooterProps) {
  return (
    <div className={`card-footer card-footer-${align} ${className}`}>
      {children}
    </div>
  );
});

const CardMedia = memo(function CardMedia({
  src,
  alt = '',
  className = '',
  overlay
}: CardMediaProps) {
  return (
    <div className={`card-media ${className}`}>
      <img src={src} alt={alt} />
      {overlay && <div className="card-media-overlay">{overlay}</div>}
    </div>
  );
});

const CardRow = memo(function CardRow({
  children,
  className = '',
  justify = 'start',
  align = 'center',
  gap = 'medium'
}: CardRowProps) {
  return (
    <div className={`card-row card-row-justify-${justify} card-row-align-${align} card-row-gap-${gap} ${className}`}>
      {children}
    </div>
  );
});

const CardColumn = memo(function CardColumn({
  children,
  className = '',
  align = 'start',
  gap = 'medium'
}: CardColumnProps) {
  return (
    <div className={`card-column card-column-align-${align} card-column-gap-${gap} ${className}`}>
      {children}
    </div>
  );
});

const Card = memo(function Card({
  children,
  variant = 'default',
  size = 'medium',
  padding = 'medium',
  className = '',
  onClick,
  hoverable = false,
  selected = false
}: CardProps) {
  const classes = [
    'card',
    `card-${variant}`,
    `card-size-${size}`,
    `card-padding-${padding}`,
    hoverable && 'card-hoverable',
    selected && 'card-selected',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}) as React.NamedExoticComponent<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Media: typeof CardMedia;
  Row: typeof CardRow;
  Column: typeof CardColumn;
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Media = CardMedia;
Card.Row = CardRow;
Card.Column = CardColumn;

export default Card;
export type { 
  CardProps, 
  CardVariant, 
  CardSize, 
  CardPadding,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardMediaProps,
  CardRowProps,
  CardColumnProps
};
