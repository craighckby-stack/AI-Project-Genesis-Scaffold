/**
 * @file remote_main.tsx
 * @description System-Integrity Entry Point for the Darlek Cann v3 Orchestration Layer.
 * This file initializes the React root, enforces strict error boundaries, and hydrates the
 * SystemContext. It serves as the primary gateway for the Agent Orchestra and ensures
 * that all telemetry and state mutations are tracked within the global epistemic framework.
 * 
 * @architecture Darlek Cann v3.0 | Next.js + Agent Orchestra + Prisma Persistence
 * @status Production-Ready
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { SystemTelemetryProvider } from './context/SystemTelemetryContext.tsx';
import './index.css';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * System-Integrity Recovery Protocol
 * Handles catastrophic rendering failures by injecting diagnostic telemetry
 * into the DOM, ensuring the system remains observable even during crashes.
 */
const handleCriticalFailure = (error: unknown, rootElement: HTMLElement) => {
  console.error('[CRITICAL_SYSTEM_FAILURE]:', error);
  
  const errorDisplay = document.createElement('div');
  errorDisplay.className = 'system-error-overlay';
  errorDisplay.innerHTML = `
    <div style="padding: 2rem; font-family: monospace; background: #000; color: #ff3333;">
      <h1>[SYSTEM_INTEGRITY_BREACH]</h1>
      <p>The Agent Orchestra has encountered a fatal state error.</p>
      <pre>${error instanceof Error ? error.stack : String(error)}</pre>
    </div>
  `;
  
  rootElement.innerHTML = '';
  rootElement.appendChild(errorDisplay);
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('[SYSTEM_INIT_FAILURE]: Root container not found in DOM.');
}

const root = createRoot(rootElement);

/**
 * Initialization of the System Orchestration Layer
 * Wraps the application in the SystemTelemetryProvider to enable global
 * state observation and epistemic health tracking.
 */
try {
  root.render(
    <StrictMode>
      <SystemTelemetryProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </SystemTelemetryProvider>
    </StrictMode>,
  );
} catch (error) {
  handleCriticalFailure(error, rootElement);
}

// Telemetry heartbeat for development environments
if (IS_DEVELOPMENT) {
  console.info('[SYSTEM_ORCHESTRATOR]: Operational. Monitoring active.');
}





