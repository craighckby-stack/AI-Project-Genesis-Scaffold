export interface Disposable {
  unsubscribe: () => void;
  teardown: () => Promise<void>;
}

export const cleanup = (disposables: Disposable[]) => {
  disposables.forEach(d => {
    d.unsubscribe();
    d.teardown().catch(console.error);
  });
};