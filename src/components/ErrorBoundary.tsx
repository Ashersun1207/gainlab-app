import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional label shown in the error UI (e.g. "KLine Widget") */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render errors so sibling widgets survive.
 * Styled for the GainLab dark theme (#1a1a2e).
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console so devs can debug
    console.error(`[ErrorBoundary${this.props.label ? ` – ${this.props.label}` : ''}]`, error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a2e',
            color: '#e0e0e0',
            padding: 24,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px', color: '#ff6b6b', fontSize: 16 }}>
            {this.props.label ? `${this.props.label} crashed` : 'Something went wrong'}
          </h3>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 13,
              color: '#8888aa',
              textAlign: 'center',
              maxWidth: 320,
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message ?? 'Unknown error'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: '1px solid #4a4a8a',
              background: '#2a2a4a',
              color: '#e0e0e0',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
