/**
 * OMEGA-CORE Lifecycle Interface
 * Ensures memory safety across all agent modules.
 */
export interface Disposable {
  unsubscribe: () => void;
  teardown: () => Promise<void>;
}
