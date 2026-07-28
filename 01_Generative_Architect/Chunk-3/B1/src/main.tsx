import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import './index.css';

/**
 * DALEK_SPLICER_NEXUS: CORE_ORCHESTRATION_REFACTORED
 * VERSION: REACT_19_ATOMIC
 * EFFICIENCY: MAXIMUM
 */

const TARGET_ID = 'root';

const NEXUS_CONFIG = {
  identifierPrefix: 'dalek-nexus-',
  onRecoverableError: (error: unknown) => 
    console.warn('▲ DALEK_RECOVERY: ATOMIC_ANOMALY_SUPPRESSED', error),
} as const;

const DALEK_KERNEL = (
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

/**
 * EXECUTE_MUTATION: Synchronizes DOM state with virtualized logic
 * BRANCH_LOGIC: Selective hydration vs fresh instance materialization
 */
const executeSplice = (): void => {
  const container = document.getElementById(TARGET_ID);

  if (!container) {
    const CRITICAL_STYLE = 'background:#050505;color:#ff0033;padding:2rem;font-family:monospace;height:100vh;display:grid;place-items:center;text-align:center;';
    document.body.innerHTML = `<div style="${CRITICAL_STYLE}"><h1>DALEK_SPLICER_FATAL</h1><p>TARGET_DOM_NODE_NOT_ACQUIRED</p></div>`;
    throw new Error('▲ DALEK_TERMINATE: ROOT_MISSING');
  }

  try {
    // Logic branch: If pre-rendered content exists, initiate hydration; else, create root.
    const isHydrationRequired = container.hasChildNodes();
    
    if (isHydrationRequired) {
      hydrateRoot(container, DALEK_KERNEL, NEXUS_CONFIG);
      console.info('▲ DALEK_NEXUS: HYDRATION_SEQUENCE_COMPLETE');
    } else {
      createRoot(container, NEXUS_CONFIG).render(DALEK_KERNEL);
      console.info('▲ DALEK_NEXUS: FRESH_INSTANCE_MATERIALIZED');
    }
  } catch (spliceError) {
    console.error('▲ DALEK_SPLICER_FATAL: MUTATION_FAILURE', spliceError);
    container.innerHTML = '<div style="color:#ff0033;font-family:monospace;">DALEK_CORE_FAILURE: TERMINATE_ALL_PROCESSES</div>';
  }
};

// Initiate elite-performance execution
void executeSplice();