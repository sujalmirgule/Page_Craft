import { WorkerEnvSchema, validateEnv } from '@pagecraft/config';

// Validate worker configuration
const env = validateEnv(WorkerEnvSchema, {
  NODE_ENV: process.env.NODE_ENV || 'development',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CONCURRENCY: process.env.CONCURRENCY || 5,
});

console.log(`\x1b[33m[PAGECRAFT WORKER]\x1b[0m Initializing background worker in ${env.NODE_ENV} mode...`);
console.log(`[PAGECRAFT WORKER] Configured Redis URL: ${env.REDIS_URL.replace(/:[^:]*@/, ':***@')}`);
console.log(`[PAGECRAFT WORKER] Concurrency limit: ${env.CONCURRENCY}`);

export interface QueueJobDefinition {
  queueName: string;
  handler: (jobData: any) => Promise<any>;
}

// Queue registry foundation
export const registeredQueues: string[] = [
  'pdf-ats-generation',
  'image-asset-optimization',
  'analytics-rollup'
];

console.log(`[PAGECRAFT WORKER] Registered background queues: ${registeredQueues.join(', ')}`);
console.log(`[PAGECRAFT WORKER] Worker process ready for BullMQ worker subscriptions.`);

// Graceful shutdown
function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Gracefully stopping worker pools...`);
  // Drain and close BullMQ workers when active
  process.exit(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
