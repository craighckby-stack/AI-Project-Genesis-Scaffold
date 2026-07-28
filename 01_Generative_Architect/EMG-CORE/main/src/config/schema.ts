import { z } from 'zod';

export const SystemConfigSchema = z.object({
  orchestration: z.object({
    agentId: z.string().uuid(),
    fallbackDepth: z.number().min(0).max(2),
    telemetryEnabled: z.boolean(),
  }),
  security: z.object({
    domainWhitelist: z.array(z.string()),
    encryptionKey: z.string().min(32),
  }),
  epistemicEngine: z.object({
    consensusThreshold: z.number().min(0).max(1),
    maxDebateRounds: z.number().int().positive(),
  }),
});

export type SystemConfig = z.infer<typeof SystemConfigSchema>;

export const validateConfig = (config: unknown): SystemConfig => {
  return SystemConfigSchema.parse(config);
};