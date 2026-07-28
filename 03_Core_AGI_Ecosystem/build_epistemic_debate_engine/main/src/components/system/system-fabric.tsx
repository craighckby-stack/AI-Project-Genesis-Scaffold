import { ThemeProvider } from '@/components/providers/theme-provider';
import { QuantumStateProvider } from '@/components/system/quantum-state-provider';
import { CoreOrchestrator } from '@/components/system/core-orchestrator';
import { SystemKernel } from '@/components/system/system-kernel';
import { SystemTelemetry } from '@/components/system/system-telemetry';
import { HydrationGuard } from '@/components/system/hydration-guard';

export const SystemFabric = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
    <QuantumStateProvider>
      <CoreOrchestrator>
        <SystemKernel>
          <SystemTelemetry>
            <HydrationGuard>
              {children}
            </HydrationGuard>
          </SystemTelemetry>
        </SystemKernel>
      </CoreOrchestrator>
    </QuantumStateProvider>
  </ThemeProvider>
);