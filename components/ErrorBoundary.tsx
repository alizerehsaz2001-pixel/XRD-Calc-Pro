import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || '';
      const isChunkOrHookError =
        msg.includes('useState') ||
        msg.includes('Invalid hook call') ||
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk');

      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-slate-200 p-6 rounded-2xl border border-rose-500/30">
          <AlertOctagon className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 max-w-md text-center mb-6">
            {isChunkOrHookError
              ? 'A module bundle mismatch occurred after an update. Reloading the app will restore a clean session.'
              : 'An unexpected error occurred in this module. The application state has been preserved.'}
          </p>
          {this.state.error && (
            <div className="bg-black/50 p-4 rounded-xl border border-slate-800 mb-6 w-full max-w-lg overflow-auto">
              <pre className="text-[10px] text-rose-400 font-mono whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl font-semibold transition-all border border-slate-700 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
