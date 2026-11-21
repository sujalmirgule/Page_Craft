import { createRealtimeServer } from './server';
import { RealtimeEnvSchema, validateEnv } from '@pagecraft/config';

const env = validateEnv(RealtimeEnvSchema, {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4002,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_32_characters_minimum',
});

const { server } = createRealtimeServer({
  port: env.PORT ?? 4002,
  jwtSecret: env.JWT_ACCESS_SECRET,
});

server.listen(env.PORT ?? 4002, () => {
  console.log(`\x1b[35m[PAGECRAFT Realtime]\x1b[0m Collaboration gateway listening on ws://localhost:${env.PORT ?? 4002}`);
});

function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down Realtime gateway...`);
  server.close(() => {
    console.log('[PAGECRAFT Realtime] Server terminated gracefully');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
