import { z } from 'zod';

/**
 * @file actionRegistry.ts
 * @description Centralized Action Orchestration Engine for DARLEK CANN v3.0.
 * Implements a type-safe, constraint-based execution framework with middleware support.
 */

export enum ActionType {
  SET_PARAM = 'SET_PARAM',
  ADD_CONSTRAINT = 'ADD_CONSTRAINT',
  SIPHON = 'SIPHON',
  BASH = 'BASH',
  EVOLVE = 'EVOLVE',
  SYSTEM_TEARDOWN = 'SYSTEM_TEARDOWN'
}

export interface ActionDefinition<T = any> {
  type: ActionType;
  payload: T;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export const ActionSchema = z.object({
  type: z.nativeEnum(ActionType),
  payload: z.any(),
  timestamp: z.number().default(() => Date.now()),
  metadata: z.record(z.any()).optional(),
});

export type Action = z.infer<typeof ActionSchema>;

type Handler<T> = (payload: T) => Promise<void>;
type Middleware = (action: Action, next: () => Promise<void>) => Promise<void>;

export class ActionRegistry {
  private static instance: ActionRegistry;
  private registry: Map<ActionType, Handler<any>> = new Map();
  private middleware: Middleware[] = [];

  private constructor() {}

  public static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  public use(fn: Middleware): void {
    this.middleware.push(fn);
  }

  public registerHandler<T>(type: ActionType, handler: Handler<T>): void {
    this.registry.set(type, handler);
  }

  public async dispatch(action: Action): Promise<void> {
    const validatedAction = ActionSchema.parse(action);
    const handler = this.registry.get(validatedAction.type);

    if (!handler) {
      throw new Error(`[ActionRegistry] No handler registered for: ${validatedAction.type}`);
    }

    const execute = async () => {
      try {
        await handler(validatedAction.payload);
      } catch (err) {
        console.error(`[ActionRegistry] Execution failed for ${validatedAction.type}:`, err);
        throw err;
      }
    };

    // Middleware chain execution
    let index = -1;
    const dispatchChain = async (i: number): Promise<void> => {
      if (i <= index) return;
      index = i;
      if (i < this.middleware.length) {
        await this.middleware[i](validatedAction, () => dispatchChain(i + 1));
      } else {
        await execute();
      }
    };

    await dispatchChain(0);
  }

  public clear(): void {
    this.registry.clear();
    this.middleware = [];
  }

  public dispose(): void {
    this.clear();
    // Logic for cleanup of external listeners would go here
  }
}