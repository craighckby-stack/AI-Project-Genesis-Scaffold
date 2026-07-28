import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * DARLEK CANN v3.0 - Orchestration Layer
 * System: Main Entry Point
 * Integration: Sovereign Kernel / Unitary Core
 */

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CRITICAL SYSTEM FAULT DETECTED:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-shell">SYSTEM_FAILURE: REBOOT_REQUIRED</div>;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('DOM_ROOT_MISSING: Cannot initialize Sovereign Kernel.');

createRoot(rootElement).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);



