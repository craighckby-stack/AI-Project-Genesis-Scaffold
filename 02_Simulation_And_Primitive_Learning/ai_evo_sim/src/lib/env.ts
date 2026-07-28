/**
 * @file src/lib/env.ts
 * @description
 * Type-safe environment variable validator for the DARLEK_CAAN_ENGINE.
 * Ensures runtime integrity by validating required variables on startup.
 */
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);





