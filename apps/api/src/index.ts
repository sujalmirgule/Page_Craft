import { createApp } from './app';
import { ApiEnvSchema, validateEnv } from '@pagecraft/config';
import { connectToDatabase, disconnectDatabase } from './database';

// Validate environment variables or use safe defaults in test/dev
const env = validateEnv(ApiEnvSchema, {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pagecraft_dev',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_32_characters_minimum',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_32_characters_minimum',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev_cookie_signing_secret_32_chars_min',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',
});

const app = createApp({
  allowedOrigins: env.ALLOWED_ORIGINS,
  jwtAccessSecret: env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  cookieSecret: env.COOKIE_SECRET,
  isProduction: env.NODE_ENV === 'production',
});

// Attempt database connection asynchronously
if (env.NODE_ENV !== 'test') {
  connectToDatabase(env.MONGODB_URI).catch((err) => {
    console.warn('\x1b[33m[PAGECRAFT API Warning]\x1b[0m Initial MongoDB connection failed (server running):', err.message);
  });
}

const server = app.listen(env.PORT, () => {
  console.log(`\x1b[32m[PAGECRAFT API]\x1b[0m Listening on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful Shutdown
async function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down API gracefully...`);
  await disconnectDatabase();
  server.close(() => {
    console.log('[PAGECRAFT API] Server closed successfully');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export * from './database';
export * from './models';
export * from './auth';
export * from './middleware';
export * from './routes';
export { createApp };
