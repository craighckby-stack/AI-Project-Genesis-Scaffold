import { ErrorBoundary } from 'react-error-boundary';
import { PerformanceBoundary } from '@/components/system/performance-boundary';

export const SystemBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary fallback={<div>System Critical Failure</div>}>
    <PerformanceBoundary>
      {children}
    </PerformanceBoundary>
  </ErrorBoundary>
);