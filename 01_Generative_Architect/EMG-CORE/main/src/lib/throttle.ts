/**
 * @file EvolutionaryThrottle.ts
 * @description High-concurrency execution controller for agent orchestration.
 * Implements semaphore-based rate limiting with abort signal propagation and metrics.
 * 
 * @architecture Siphoned from 'unitary-core' and 'darlek-cann-v3' orchestration patterns.
 */

export type ThrottlePriority = 'high' | 'normal' | 'low';

export interface ThrottleMetrics {
  activeCount: number;
  queueLength: number;
  totalExecuted: number;
}

export class EvolutionaryThrottle {
  private activeCount = 0;
  private totalExecuted = 0;
  private queue: { task: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void; signal?: AbortSignal }[] = [];

  constructor(private readonly maxConcurrency: number) {}

  public get metrics(): ThrottleMetrics {
    return {
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      totalExecuted: this.totalExecuted,
    };
  }

  async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    if (this.activeCount >= this.maxConcurrency) {
      return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
          this.queue = this.queue.filter(q => q.resolve !== resolve);
          reject(new DOMException('Aborted', 'AbortError'));
        };

        signal?.addEventListener('abort', onAbort, { once: true });
        
        this.queue.push({
          task: async () => {
            signal?.removeEventListener('abort', onAbort);
            try {
              const result = await task();
              resolve(result);
            } catch (err) {
              reject(err);
            }
          },
          resolve,
          reject,
          signal
        });
      });
    }

    return this.execute(task);
  }

  private async execute<T>(task: () => Promise<T>): Promise<T> {
    this.activeCount++;
    try {
      const result = await task();
      this.totalExecuted++;
      return result;
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }

  private processNext(): void {
    if (this.queue.length > 0) {
      const nextItem = this.queue.shift();
      if (nextItem && !nextItem.signal?.aborted) {
        nextItem.task();
      } else if (nextItem) {
        this.processNext();
      }
    }
  }
}























