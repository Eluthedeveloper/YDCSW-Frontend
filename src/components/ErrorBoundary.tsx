import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it so a single bad component
 * shows a message instead of a blank page. There is no real need to
 * distinguish cases here; the details are logged for diagnosis.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-dark-800">
        <div className="glass-panel rounded-xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold dark:text-white text-dark-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm dark:text-dark-200 text-dark-600 mb-4">
            The page failed to render. Reloading usually clears it.
          </p>
          <pre className="text-xs text-left dark:text-dark-300 text-dark-500 bg-black/5 dark:bg-black/20 rounded-lg p-3 mb-4 overflow-auto max-h-40">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}