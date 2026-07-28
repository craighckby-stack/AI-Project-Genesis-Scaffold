export const logSystemEvent = (event: string, metadata: Record<string, any>) => {
  console.log(`[EMG-CORE] ${event}`, metadata);
  // Integration point for DARLEK CANN v3 telemetry pipeline
};

export const getSystemMetrics = () => ({
  timestamp: Date.now(),
  memory: (performance as any).memory?.usedJSHeapSize || 0
});