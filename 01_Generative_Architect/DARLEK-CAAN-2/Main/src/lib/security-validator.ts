import { z } from 'zod';
import { WorldSchema, AgentSchema } from '../types/schema';

export const validateState = (data: unknown, schema: z.ZodSchema) => {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(`Security Violation: ${result.error.message}`);
  return result.data;
};



