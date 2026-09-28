import React from 'react';
import '../styles/ErrorBoundary.css';
import api from '../utils/api';
import { getRecentTelemetry, recordClientTelemetry } from '../lib/telemetry';

const isDevelopment = import.meta.env.DEV;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error });
    recordClientTelemetry('client_errors', {
      errorName: error?.name || 'Error',
      routeSegment: this.props.segment || 'app',
    });
    if (isDevelopment) {
      console.error('Page error stack:', error?.stack, errorInfo?.componentStack);
    } else {
      console.error('Unhandled page error');
    }
    api.post('/telemetry/errors', {
      errorName: error?.name || 'Error',
      routeSegment: this.props.segment || 'app',
      recent: getRecentTelemetry(20),
    }).catch(() => console.error('Error report delivery failed'));
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.resetError })
          : this.props.fallback;
      }
      return (
        <div className={`error-boundary ${this.props.segment === 'room' ? 'error-boundary--dark' : ''}`}>
          <div className="error-boundary__container">
            <h1 className="error-boundary__title">Something went wrong on this page</h1>
            <p className="error-boundary__message">
              Something went wrong. Please try again.
            </p>
            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.resetError}
              >
                Retry
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
