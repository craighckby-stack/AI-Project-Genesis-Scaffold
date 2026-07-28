import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  LLM_DEFAULT_MODEL: z.string().default('gemini-1.5-pro'),
});

export const env = envSchema.parse(process.env);