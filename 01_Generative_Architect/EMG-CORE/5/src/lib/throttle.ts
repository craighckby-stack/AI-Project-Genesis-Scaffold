/**
 * SLIDING WINDOW SUBSTRATE THROTTLE: A concurrency management pattern that regulates
 * throughput to prevent substrate exhaustion (rate-limiting).
 */
export class SubstrateThrottle {
  private maxConcurrency: number;
  private runningPromises: Promise<any>[] = [];

  constructor(maxConcurrency: number = 3) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Executes a task within the sliding window constraints.
   */
  async run<T>(task: () => Promise<T>): Promise<T> {
    while (this.runningPromises.length >= this.maxConcurrency) {
      await Promise.race(this.runningPromises);
      // Yield to the event loop to ensure the finally callback runs and removes the completed task
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    const evolutionTask = task().finally(() => {
      const index = this.runningPromises.indexOf(evolutionTask);
      if (index > -1) this.runningPromises.splice(index, 1);
    });

    this.runningPromises.push(evolutionTask);
    return evolutionTask;
  }

  /**
   * Evolve all repositories using the sliding window throttle.
   */
  async evolveAll<T>(tasks: (() => Promise<T>)[]): Promise<PromiseSettledResult<T>[]> {
    const executedTasks = tasks.map(task => this.run(task));
    return await Promise.allSettled(executedTasks);
  }
}

export const defaultThrottle = new SubstrateThrottle(3);
