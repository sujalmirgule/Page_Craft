import jwt, { SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@pagecraft/types';
import type { CookieOptions } from 'express';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion?: number;
}

/**
 * Generate a short-lived signed JWT access token
 */
export function generateAccessToken(
  payload: AuthTokenPayload,
  secret: string,
  expiresIn: string | number = '15m'
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    issuer: 'pagecraft.app',
    audience: 'pagecraft-client',
    algorithm: 'HS256',
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Generate a rotatable signed JWT refresh token
 */
export function generateRefreshToken(
  payload: RefreshTokenPayload,
  secret: string,
  expiresIn: string | number = '7d'
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    issuer: 'pagecraft.app',
    audience: 'pagecraft-refresh',
    algorithm: 'HS256',
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Verify access token signature and expiration
 */
export function verifyAccessToken(token: string, secret: string): AuthTokenPayload {
  return jwt.verify(token, secret, {
    issuer: 'pagecraft.app',
    audience: 'pagecraft-client',
    algorithms: ['HS256'],
  }) as AuthTokenPayload;
}

/**
 * Verify refresh token signature and expiration
 */
export function verifyRefreshToken(token: string, secret: string): RefreshTokenPayload {
  return jwt.verify(token, secret, {
    issuer: 'pagecraft.app',
    audience: 'pagecraft-refresh',
    algorithms: ['HS256'],
  }) as RefreshTokenPayload;
}

/**
 * HTTP-only cookie configuration for refresh tokens
 */
export function getRefreshCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/v1/auth', // Scoped strictly to authentication endpoints
  };
}
