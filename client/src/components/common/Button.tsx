import { ReactNode, MouseEvent, memo } from 'react';
import '../../styles/components/button.css';

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

const Button = memo(function Button({
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
      {loading ? <span className="spinner-small"></span> : null}
      {children}
    </button>
  );
});

export default Button;
