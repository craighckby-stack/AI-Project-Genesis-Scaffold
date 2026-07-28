import { promises as fs } from 'fs';

export class RefactorEngine {
  private activeOperations: Map<string, AbortController> = new Map();

  async execute(filePath: string, operations: any[]): Promise<void> {
    const controller = new AbortController();
    this.activeOperations.set(filePath, controller);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let transformed = content;
      
      for (const op of operations) {
        if (controller.signal.aborted) break;
        transformed = transformed.replace(op.pattern, op.replacement);
      }

      await fs.writeFile(filePath, transformed);
    } finally {
      this.activeOperations.delete(filePath);
    }
  }

  dispose(): void {
    this.activeOperations.forEach(c => c.abort());
    this.activeOperations.clear();
  }
}