import React, { StrictMode, Component, ErrorInfo, ReactNode, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * DARLEK CANN v3.0: System Orchestration Layer
 * Siphoned from: unitary-core & sovereign-final specifications.
 */

interface SystemState {
  version: string;
  status: 'INITIALIZING' | 'OPERATIONAL' | 'CRITICAL_FAILURE';
  telemetry: Record<string, any>;
}

const SystemContext = createContext<SystemState>({
  version: '3.0.0',
  status: 'INITIALIZING',
  telemetry: {}
});

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class QuantumErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[DARLEK_CANN_CRITICAL]:", error, errorInfo);
    // Integration point for external logging services (e.g., Sentry/LogRocket)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="system-failure-overlay">
          <h1>SYSTEM_FAILURE_DETECTED</h1>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()}>REBOOT_CORE</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const RootInitializer = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('CORE_ROOT_NOT_FOUND: System initialization aborted.');

  return (
    <StrictMode>
      <SystemContext.Provider value={{ version: '3.0.0', status: 'OPERATIONAL', telemetry: {} }}>
        <QuantumErrorBoundary>
          <App />
        </QuantumErrorBoundary>
      </SystemContext.Provider>
    </StrictMode>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<RootInitializer />);

// Cleanup handler for hot-module replacement and system teardown
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    root.unmount();
  });
}























