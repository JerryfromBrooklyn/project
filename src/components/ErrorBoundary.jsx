import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <details className="whitespace-pre-wrap">
            <summary className="cursor-pointer font-medium text-red-700">
              View error details
            </summary>
            <p className="mt-2">{this.state.error && this.state.error.toString()}</p>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          {this.props.fallback || 
            <div className="mt-4">
              <p>Please try refreshing the page or contact support if the problem persists.</p>
            </div>
          }
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 