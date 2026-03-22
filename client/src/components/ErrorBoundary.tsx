import { Component, ReactNode, ErrorInfo } from 'react';

import { AlertCircle, RefreshCw } from 'lucide-react';
import './ErrorBoundary.css';

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
        <div className="error-boundary">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <AlertCircle size={32} color="white" />
            </div>

            <h1 className="error-boundary-title">
              Something went wrong
            </h1>

            <p className="error-boundary-message">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <pre className="error-boundary-error">
                {this.state.error.message}
              </pre>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReload}
                className="error-boundary-btn-primary"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="error-boundary-btn-secondary"
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
