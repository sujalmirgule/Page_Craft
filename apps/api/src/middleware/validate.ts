import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import type { ApiResponse } from '@pagecraft/types';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issues[0]?.message || 'Input validation failed',
          details: issues,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
      res.status(400).json(response);
      return;
    }
    req.body = result.data;
    next();
  };
}
