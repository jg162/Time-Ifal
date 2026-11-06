import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from './db';
import { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'time-ifal-super-secret-volleyball-key-2026';
const COOKIE_NAME = 'time_ifal_token';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: { id: string; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export function getAuthTokenFromRequest(request: NextRequest): string | null {
  // Check cookie first
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie) return cookie;

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  const token = getAuthTokenFromRequest(request);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;

  return getUserById(payload.id);
}
