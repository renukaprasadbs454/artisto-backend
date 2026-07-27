/**
 * Hash a password with bcrypt, cost factor 12.
 */
/**
 * Compare a plain text password against a bcrypt hash.
 */
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { prisma } from '../utils/prisma';

// Argon2 parameters
const ARGON_TIME = Number(process.env.ARGON_TIME) || 3; // iterations
const ARGON_MEMORY = Number(process.env.ARGON_MEMORY) || 1 << 16; // 64 MB
const ARGON_PARALLELISM = Number(process.env.ARGON_PARALLELISM) || 1;

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY_MS = Number(process.env.REFRESH_TOKEN_EXPIRY_MS) || 30 * 24 * 60 * 60 * 1000; // 30 days
// refresh tokens will be hashed with Argon2 as well for consistency

/**
 * Hash a password with Argon2id using conservative defaults.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    timeCost: ARGON_TIME,
    memoryCost: ARGON_MEMORY,
    parallelism: ARGON_PARALLELISM,
  });
}

/**
 * Verify a plain password against an Argon2 hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (e) {
    return false;
  }
}

/**
 * Sign a JWT access token with userId and role.
 * Expires in 15 minutes.
 */
export function signAccessToken(userId: string, role: string): string {
  // Support asymmetric signing (RS256) if private key provided, otherwise HS256.
  const privateKey = process.env.JWT_ACCESS_PRIVATE_KEY;
  if (privateKey) {
    return jwt.sign({ userId, role } as any, privateKey.replace(/\\n/g, '\n') as jwt.Secret, { algorithm: 'RS256', expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions);
  }
  const secret = process.env.JWT_ACCESS_SECRET!;
  return jwt.sign({ userId, role } as any, secret as jwt.Secret, { algorithm: 'HS256', expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions);
}

/**
 * Generate an opaque refresh token.
 * Returns the raw token string (to be sent as a cookie)
 * and a bcrypt hash of it (to be stored in the DB).
 * 
 * Cookie value format: `${userId}.${rawToken}` — so we can look up the user
 * without needing a separate table, since bcrypt hashes aren't queryable.
 */
export async function generateRefreshToken(userId: string): Promise<{
  cookieValue: string;
  hash: string;
}> {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hash = await argon2.hash(rawToken, {
    type: argon2.argon2id,
    timeCost: ARGON_TIME,
    memoryCost: ARGON_MEMORY,
    parallelism: ARGON_PARALLELISM,
  });
  const cookieValue = `${userId}.${rawToken}`;
  return { cookieValue, hash };
}

/**
 * Parse the refresh token cookie value to extract userId and raw token.
 */
export function parseRefreshCookie(cookieValue: string): { userId: string; rawToken: string } | null {
  const dotIndex = cookieValue.indexOf('.');
  if (dotIndex === -1) return null;
  return {
    userId: cookieValue.slice(0, dotIndex),
    rawToken: cookieValue.slice(dotIndex + 1),
  };
}

/**
 * Verify a raw refresh token against a stored bcrypt hash.
 */
export async function verifyRefreshToken(rawToken: string, storedHash: string): Promise<boolean> {
  try {
    return await argon2.verify(storedHash, rawToken);
  } catch (e) {
    return false;
  }
}

/**
 * Set the refresh token as an httpOnly secure cookie on the response.
 */
export function setRefreshCookie(res: Response, cookieValue: string): void {
  res.cookie('refreshToken', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/',
  });
}

/**
 * Clear the refresh token cookie.
 */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Invalidate all existing access tokens for a user by setting `tokenInvalidBefore`.
 * Call this on password reset, manual logout-from-all-devices, or suspicious activity.
 */
export async function invalidateUserTokens(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { tokenInvalidBefore: new Date() } });
}
