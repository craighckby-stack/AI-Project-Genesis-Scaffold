import { z } from 'zod';

export interface ToolContext {
  workspaceId: string;
  agentId: string;
  traceId: string;
}

export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  metadata: { executionTime: number };
}

export type ToolHandler<I, O> = (input: I, context: ToolContext) => Promise<ToolResult<O>>;



