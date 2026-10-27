import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  /** React dev builds provide where in the render tree the error came from. */
  componentStack: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // HMR keeps a stale module in some hot-update paths, so a thrown error may
    // not match what re-logs. Both channels get the stack: the console for a
    // developer, the panel for anyone reporting the bug without devtools.
    console.error('Uncaught render error:', error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  render() {
    const { error, componentStack } = this.state;
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
          {componentStack && (
            <details className="mb-4 text-left">
              <summary className="text-xs cursor-pointer dark:text-dark-300 text-dark-600 mb-1">
                Component stack
              </summary>
              <pre className="text-[10px] dark:text-dark-300 text-dark-500 bg-black/5 dark:bg-black/20 rounded-lg p-3 overflow-auto max-h-60 whitespace-pre-wrap">
                {componentStack}
              </pre>
            </details>
          )}
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
