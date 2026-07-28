import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const ROOT_ELEMENT_ID = 'root';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application Error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <div className="error-fallback">Application crashed. Please refresh.</div>;
    }
    return this.props.children;
  }
}

function bootstrap(): void {
  const container = document.getElementById(ROOT_ELEMENT_ID);

  if (!(container instanceof HTMLElement)) {
    throw new Error(`Root element #${ROOT_ELEMENT_ID} not found or is not an HTMLElement.`);
  }

  const root = createRoot(container);

  root.render(
    <StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </StrictMode>
  );
}

// Execute bootstrap
try {
  bootstrap();
} catch (error) {
  console.error('Critical bootstrap failure:', error);
  const root = document.getElementById(ROOT_ELEMENT_ID);
  if (root) {
    root.innerHTML = '<div class="error-fallback">Critical failure. Please check console.</div>';
  }
}














