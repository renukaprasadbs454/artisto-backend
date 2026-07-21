import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';

const BCRYPT_ROUNDS = 12;
const BCRYPT_REFRESH_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Hash a password with bcrypt, cost factor 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plain text password against a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT access token with userId and role.
 * Expires in 15 minutes.
 */
export function signAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
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
  const hash = await bcrypt.hash(rawToken, BCRYPT_REFRESH_ROUNDS);
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
  return bcrypt.compare(rawToken, storedHash);
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
