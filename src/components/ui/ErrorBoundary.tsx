import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card fade-in" style={{
          padding: '24px', borderRadius: '12px', background: '#FEF2F2',
          border: '1px solid #FCA5A5', color: '#991B1B', margin: '20px 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <AlertCircle size={20} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
              {this.props.fallbackTitle || 'Analytics Engine Error'}
            </h3>
          </div>

          <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 12px', color: '#991B1B' }}>
            {this.state.error?.name}: {this.state.error?.message || 'An unexpected error occurred.'}
          </p>

          {/* Full Error Stack Log */}
          <div style={{
            background: '#1E1E2E', color: '#F38BA8', padding: '14px', borderRadius: '10px',
            fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '16px', border: '1px solid #313244',
            overflowX: 'auto', maxHeight: '250px'
          }}>
            <div style={{ color: '#89B4FA', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={14} /> Full Runtime Exception Trace:
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.stack || 'No stack trace available.'}
            </pre>
            {this.state.errorInfo?.componentStack && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #313244', color: '#A6ADC8' }}>
                <div style={{ fontWeight: 700, color: '#F9E2AF', marginBottom: '4px' }}>Component Stack:</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>

          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              background: '#DC2626', color: 'white', border: 'none',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Reset & Retry Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
