import { z } from 'zod';

export const MutationRequestSchema = z.object({
  id: z.string().uuid(),
  payload: z.record(z.unknown()),
  signature: z.string(),
  timestamp: z.number(),
  priority: z.enum(['CRITICAL', 'ADAPTIVE', 'MAINTENANCE']),
});

export type MutationRequest = z.infer<typeof MutationRequestSchema>;



