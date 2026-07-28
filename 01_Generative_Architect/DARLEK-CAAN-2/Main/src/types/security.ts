import { z } from 'zod';

export const SecurityConfig = z.object({
  maxIntegrity: z.number().default(100),
  minPopulation: z.number().default(0),
  enforceQuantumSigning: z.boolean().default(true),
});

export type SecurityConfig = z.infer<typeof SecurityConfig>;




