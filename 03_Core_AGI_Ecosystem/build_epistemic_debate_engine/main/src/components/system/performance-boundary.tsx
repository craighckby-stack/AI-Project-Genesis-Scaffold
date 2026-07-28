import { ErrorBoundary } from 'react-error-boundary';

export function PerformanceBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<div className="p-4 text-red-500">OMEGA-CORE CRITICAL FAILURE</div>}>
      {children}
    </ErrorBoundary>
  );
}