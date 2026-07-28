import { v4 as uuidv4 } from 'uuid';

/**
 * @file registry.ts
 * @description Advanced Subscription Orchestration Engine.
 * Part of the DARLEK-CANN v3.0 ecosystem.
 * Implements hierarchical cleanup and diagnostic tracking for Firestore/Realtime listeners.
 */

export type Unsubscribe = () => void;

export interface RegistryEntry {
  id: string;
  scope: string;
  unsubscribe: Unsubscribe;
  timestamp: number;
}

export class SubscriptionRegistry {
  private static listeners: Map<string, RegistryEntry> = new Map();

  /**
   * Registers a listener with a specific scope for granular lifecycle management.
   */
  static register(scope: string, unsubscribe: Unsubscribe): string {
    const id = `${scope}:${uuidv4()}`;
    this.listeners.set(id, {
      id,
      scope,
      unsubscribe,
      timestamp: Date.now(),
    });
    return id;
  }

  /**
   * Safely executes and removes a specific listener.
   */
  static cleanup(id: string): void {
    const entry = this.listeners.get(id);
    if (entry) {
      try {
        entry.unsubscribe();
      } catch (err) {
        console.error(`[RegistryOrchestrator] Failed to cleanup listener ${id}:`, err);
      }
      this.listeners.delete(id);
    }
  }

  /**
   * Purges all listeners associated with a specific scope (e.g., 'auth', 'chat', 'game-loop').
   */
  static purgeScope(scope: string): void {
    this.listeners.forEach((entry, id) => {
      if (entry.scope === scope) {
        this.cleanup(id);
      }
    });
  }

  /**
   * Global teardown for application shutdown or context reset.
   */
  static purgeAll(): void {
    this.listeners.forEach((_, id) => this.cleanup(id));
    this.listeners.clear();
  }

  static getActiveCount(): number {
    return this.listeners.size;
  }

  static getRegistrySnapshot(): RegistryEntry[] {
    return Array.from(this.listeners.values());
  }
}