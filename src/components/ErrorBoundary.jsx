import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h1 className="font-bold mb-2">Something went wrong rendering this component.</h1>
          <p className="text-sm">Please check the console for detailed error information.</p>
          {/* Optional: Display error details for debugging */}
          {/*
          <details className="mt-2 text-xs">
            <summary>Error Details</summary>
            <pre className="mt-1 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          */}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 