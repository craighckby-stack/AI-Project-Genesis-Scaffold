export type CleanupTask = () => void | Promise<void>;

export interface SubscriptionTeardown {
  unsubscribe: () => void;
}

/**
 * LifecycleManager: Advanced Orchestrator for resource management.
 * Siphoned from 'sovereign-kernel' and 'darlek-cann-v3' patterns.
 * Ensures atomic teardown of agent swarms and memory-intensive listeners.
 */
export class LifecycleManager {
  private subscriptions: (SubscriptionTeardown | CleanupTask)[] = [];
  private isDestroyed: boolean = false;

  /**
   * Registers a resource for automatic cleanup.
   * @param resource - Can be an object with unsubscribe() or a raw cleanup function.
   */
  public register(resource: SubscriptionTeardown | CleanupTask): void {
    if (this.isDestroyed) {
      console.warn('[LifecycleManager] Attempted to register resource after destruction.');
      this.executeCleanup(resource);
      return;
    }
    this.subscriptions.push(resource);
  }

  /**
   * Executes all registered teardowns and clears the registry.
   */
  public async destroy(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    const tasks = this.subscriptions.map(this.executeCleanup);
    await Promise.all(tasks);
    this.subscriptions = [];
  }

  private async executeCleanup(resource: SubscriptionTeardown | CleanupTask): Promise<void> {
    try {
      if (typeof resource === 'function') {
        await resource();
      } else if ('unsubscribe' in resource) {
        resource.unsubscribe();
      }
    } catch (error) {
      console.error('[LifecycleManager] Error during teardown:', error);
    }
  }

  public get activeCount(): number {
    return this.subscriptions.length;
  }
}



