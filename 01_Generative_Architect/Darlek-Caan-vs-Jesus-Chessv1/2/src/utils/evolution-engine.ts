export const GlobalTeardownRegistry = new Set<() => void>();

export const rollback = (backupPath: string) => {
  console.error('Mutation failed. Initiating rollback from:', backupPath);
  // Implementation for file restoration
};

export const registerCleanup = (fn: () => void) => {
  GlobalTeardownRegistry.add(fn);
};

export const executeTeardown = () => {
  GlobalTeardownRegistry.forEach(cleanup => cleanup());
  GlobalTeardownRegistry.clear();
};




