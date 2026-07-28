/**
 * GlobalTeardownRegistry: Ensures memory safety for injected modules.
 * Siphoned from sovereign-kernel architecture.
 */
export class GlobalTeardownRegistry {
  private registry: WeakRef<() => void>[] = [];

  register(unsubscribe: () => void) {
    this.registry.push(new WeakRef(unsubscribe));
  }

  execute() {
    this.registry.forEach((ref) => {
      const cleanup = ref.deref();
      if (cleanup) cleanup();
    });
    this.registry = [];
  }
}

export const registry = new GlobalTeardownRegistry();