import { WorldSchema, AgentSchema } from './schema';

export const validateState = (data: unknown, schema: typeof WorldSchema | typeof AgentSchema) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`SECURITY_VIOLATION: ${JSON.stringify(result.error)}`);
  }
  return result.data;
};

export const enforceIntegrity = (current: number, next: number) => {
  if (next !== current + 1) throw new Error('EPOCH_INJECTION_DETECTED');
};




