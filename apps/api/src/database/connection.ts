import mongoose from 'mongoose';

export interface DatabaseConnectionConfig {
  uri?: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
}

let isInitialized = false;

function registerConnectionEvents(): void {
  if (isInitialized) return;
  isInitialized = true;

  mongoose.connection.on('connected', () => {
    console.log('\x1b[32m[MongoDB Atlas]\x1b[0m Successfully connected to database cluster');
  });

  mongoose.connection.on('error', (err) => {
    console.error('\x1b[31m[MongoDB Atlas Error]\x1b[0m Connection failure:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('\x1b[33m[MongoDB Atlas Warning]\x1b[0m Disconnected from database cluster');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('\x1b[36m[MongoDB Atlas]\x1b[0m Reconnected to database cluster');
  });
}

/**
 * Connect to MongoDB Atlas with connection pooling and resilience configuration
 */
export async function connectToDatabase(
  uri?: string,
  options: mongoose.ConnectOptions = {}
): Promise<typeof mongoose> {
  const targetUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/pagecraft';

  registerConnectionEvents();

  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const defaultOptions: mongoose.ConnectOptions = {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    ...options,
  };

  return mongoose.connect(targetUri, defaultOptions);
}

/**
 * Gracefully close database connection pool
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB Atlas] Connection pool closed successfully');
  }
}

/**
 * Check if MongoDB connection is active
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get human-readable connection state
 */
export function getDatabaseConnectionState(): 'disconnected' | 'connected' | 'connecting' | 'disconnecting' {
  const states: Record<number, 'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'disconnected';
}
