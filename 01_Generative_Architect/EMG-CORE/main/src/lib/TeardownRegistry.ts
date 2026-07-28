export class TeardownRegistry {
  private disposables: (() => void)[] = [];

  add(fn: () => void) {
    this.disposables.push(fn);
  }

  dispose() {
    this.disposables.forEach(fn => fn());
    this.disposables = [];
  }
}
