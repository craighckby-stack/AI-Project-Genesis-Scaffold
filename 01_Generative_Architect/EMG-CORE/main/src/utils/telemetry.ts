/**
 * @fileoverview Telemetry Orchestrator - DARLEK CANN v3.0
 * Provides high-fidelity system event tracking, batching, and diagnostic reporting.
 * Integrated with unitary-core and DARLEK_CAAN_ENGINE telemetry standards.
 */

export enum LogSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

interface TelemetryEvent {
  type: string;
  severity: LogSeverity;
  data: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
}

class TelemetryEngine {
  private static instance: TelemetryEngine;
  private queue: TelemetryEvent[] = [];
  private readonly sessionId: string = crypto.randomUUID();
  private readonly BATCH_LIMIT = 10;

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  public static getInstance(): TelemetryEngine {
    if (!TelemetryEngine.instance) {
      TelemetryEngine.instance = new TelemetryEngine();
    }
    return TelemetryEngine.instance;
  }

  public log(type: string, data: Record<string, unknown>, severity: LogSeverity = LogSeverity.INFO): void {
    const event: TelemetryEvent = {
      type,
      severity,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    if (severity === LogSeverity.CRITICAL || severity === LogSeverity.ERROR) {
      this.transmit([event]);
    } else {
      this.queue.push(event);
      if (this.queue.length >= this.BATCH_LIMIT) this.flush();
    }
  }

  private transmit(events: TelemetryEvent[]): void {
    if (typeof window === 'undefined' || !window.navigator.sendBeacon) return;
    const blob = new Blob([JSON.stringify(events)], { type: 'application/json' });
    window.navigator.sendBeacon('/api/telemetry/ingest', blob);
  }

  public flush(): void {
    if (this.queue.length === 0) return;
    this.transmit([...this.queue]);
    this.queue = [];
  }
}

export const telemetry = TelemetryEngine.getInstance();

/**
 * Legacy support wrapper for system-wide event logging.
 */
export const logSystemEvent = (type: string, data: any, severity: LogSeverity = LogSeverity.INFO) => {
  telemetry.log(type, typeof data === 'object' ? data : { message: data }, severity);
};























