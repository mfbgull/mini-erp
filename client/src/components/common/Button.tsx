import { ReactNode, MouseEvent } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
type ButtonType = 'button' | 'submit' | 'reset';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  type?: ButtonType;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = ''
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className} ${loading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="spinner-small"></span>}
      {children}
    </button>
  );
}
