import { EventEmitter } from 'events';

/**
 * @fileoverview Advanced Diagnostics Orchestrator
 * Siphoned from unitary-core & DARLEK-CAAN-v3 architectures.
 * Provides high-fidelity telemetry, circular buffer history, and health-check heartbeats.
 */

export interface TelemetryPayload {
  agentId: string;
  timestamp: number;
  metrics: {
    cognitiveLoad: number;
    epistemicConvergence: number;
    quantumEntropy: number;
    systemHealth: number;
  };
}

export type DiagnosticCallback = (data: TelemetryPayload) => void;

class DiagnosticsEngine extends EventEmitter {
  private history: TelemetryPayload[] = [];
  private readonly MAX_HISTORY = 256;
  private static instance: DiagnosticsEngine;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  public static getInstance(): DiagnosticsEngine {
    if (!DiagnosticsEngine.instance) {
      DiagnosticsEngine.instance = new DiagnosticsEngine();
    }
    return DiagnosticsEngine.instance;
  }

  /**
   * Records metrics using a circular buffer strategy to prevent memory leaks.
   */
  public recordMetrics(payload: TelemetryPayload): void {
    if (this.history.length >= this.MAX_HISTORY) {
      this.history.shift();
    }
    this.history.push(payload);
    this.emit('metricsUpdated', payload);
  }

  /**
   * Reactive subscription pattern with automatic cleanup.
   */
  public subscribe(callback: DiagnosticCallback): () => void {
    this.on('metricsUpdated', callback);
    return () => this.off('metricsUpdated', callback);
  }

  public getSnapshot(): TelemetryPayload[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    this.emit('cleared');
  }
}

export const diagnostics = DiagnosticsEngine.getInstance();