import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--neutral-50, #F8F9FA)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '2rem',
            boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.07))',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.5rem',
              backgroundColor: 'var(--error, #EF4444)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={32} color="white" />
            </div>
            
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--neutral-900, #212529)'
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              color: 'var(--neutral-400, #6C757D)',
              marginBottom: '1.5rem',
              lineHeight: 1.5
            }}>
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={{
                backgroundColor: 'var(--neutral-50, #F8F9FA)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm, 4px)',
                fontSize: '0.875rem',
                color: 'var(--error, #EF4444)',
                marginBottom: '1.5rem',
                overflow: 'auto',
                textAlign: 'left'
              }}>
                {this.state.error.message}
              </pre>
            )}
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--primary, #367BF5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm, 4px)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--neutral-400, #6C757D)',
                  border: '1px solid var(--neutral-400, #6C757D)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
