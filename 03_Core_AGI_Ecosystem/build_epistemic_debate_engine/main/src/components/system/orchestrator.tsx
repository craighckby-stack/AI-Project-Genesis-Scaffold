import { SystemTelemetryProvider } from './telemetry';
import { SystemStateProvider } from './state-provider';

export function SystemOrchestrator({ children }: { children: React.ReactNode }) {
  return (
    <SystemTelemetryProvider>
      <SystemStateProvider>
        {children}
      </SystemStateProvider>
    </SystemTelemetryProvider>
  );
}