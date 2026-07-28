export class SubscriptionRegistry {
  private listeners: (() => void)[] = [];

  register(fn: () => void) {
    this.listeners.push(fn);
  }

  purge() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}
