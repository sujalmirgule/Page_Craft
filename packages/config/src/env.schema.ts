import { z } from 'zod';

export const NodeEnvSchema = z.enum(['development', 'test', 'staging', 'production']).default('development');

export const ApiEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema,
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 chars'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

export const WorkerEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema,
  REDIS_URL: z.string().min(1, 'REDIS_URL is required for worker queues'),
  CONCURRENCY: z.coerce.number().default(5),
});

export const RealtimeEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema,
  PORT: z.coerce.number().default(4002),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required for realtime cluster'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET is required to verify socket handshake'),
});

export const WebEnvSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
  VITE_REALTIME_WS_URL: z.string().default('ws://localhost:4002'),
  VITE_APP_DOMAIN: z.string().default('pagecraft.app'),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
export type RealtimeEnv = z.infer<typeof RealtimeEnvSchema>;
export type WebEnv = z.infer<typeof WebEnvSchema>;

export function validateEnv<T>(schema: z.ZodSchema<T>, env: Record<string, any>): T {
  const result = schema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
    console.error(`\x1b[31m[Environment Validation Error]:\x1b[0m\n${errorDetails}`);
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
}
