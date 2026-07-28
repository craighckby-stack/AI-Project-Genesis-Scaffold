export interface SystemLifecycleEvent {
  type: 'BOOT_COMPLETE' | 'BOOT_FAILED' | 'SYSTEM_RESET';
  payload: Record<string, unknown>;
}

export interface BootstrapConfig {
  priority: 'CRITICAL' | 'LAZY';
  retryCount: number;
}