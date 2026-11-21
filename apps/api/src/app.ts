import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { ApiResponse } from '@pagecraft/types';
import { getDatabaseConnectionState } from './database';
import { createAuthRouter } from './routes/auth.routes';
import { createWorkspaceRouter } from './routes/workspace.routes';

export interface AppOptions {
  allowedOrigins?: string;
  jwtAccessSecret?: string;
  jwtRefreshSecret?: string;
  cookieSecret?: string;
  isProduction?: boolean;
  googleClientId?: string;
  googleCallbackUrl?: string;
  githubClientId?: string;
  githubCallbackUrl?: string;
}

export function createApp(options: string | AppOptions = 'http://localhost:3000'): express.Application {
  const opts: AppOptions =
    typeof options === 'string'
      ? { allowedOrigins: options }
      : options;

  const allowedOrigins = opts.allowedOrigins || 'http://localhost:3000,http://localhost:5173';
  const jwtAccessSecret = opts.jwtAccessSecret || process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_32_characters_minimum';
  const jwtRefreshSecret = opts.jwtRefreshSecret || process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_32_characters_minimum';
  const cookieSecret = opts.cookieSecret || process.env.COOKIE_SECRET || 'dev_cookie_signing_secret_32_chars_min';
  const isProduction = opts.isProduction ?? process.env.NODE_ENV === 'production';

  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );

  // Cookie Parser Middleware
  app.use(cookieParser(cookieSecret));

  // Body Parsing Middleware
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health and System Endpoints
  app.get('/api/v1/health', (req: Request, res: Response) => {
    const dbState = getDatabaseConnectionState();
    const response: ApiResponse<{ status: string; database: string; uptime: number; timestamp: string }> = {
      success: true,
      data: {
        status: 'healthy',
        database: dbState,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    res.status(200).json(response);
  });

  app.get('/api/v1/version', (req: Request, res: Response) => {
    const response: ApiResponse<{ service: string; version: string; schemaVersion: number }> = {
      success: true,
      data: {
        service: 'PAGECRAFT API',
        version: '1.0.0',
        schemaVersion: 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    res.status(200).json(response);
  });

  // Mount Feature Routers
  app.use(
    '/api/v1/auth',
    createAuthRouter({
      jwtAccessSecret,
      jwtRefreshSecret,
      isProduction,
      googleClientId: opts.googleClientId,
      googleCallbackUrl: opts.googleCallbackUrl,
      githubClientId: opts.githubClientId,
      githubCallbackUrl: opts.githubCallbackUrl,
    })
  );

  app.use('/api/v1/workspaces', createWorkspaceRouter(jwtAccessSecret));

  // 404 Handler
  app.use((req: Request, res: Response) => {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    res.status(404).json(response);
  });

  // Global Error Handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[API Error]:', err);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
    res.status(500).json(response);
  });

  return app;
}
