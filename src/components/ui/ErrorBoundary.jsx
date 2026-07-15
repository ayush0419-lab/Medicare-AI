import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // You can also log the error to an error reporting service like Sentry here
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#040d1a] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/20 p-8 rounded-lg max-w-lg w-full text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">
              An unexpected error occurred in the application. We've been notified and are looking into it.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-black/40 p-4 rounded-xl border border-red-500/10 mb-6 overflow-auto max-h-48 text-xs text-red-300 font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-medium rounded-xl transition-colors outline-none"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
