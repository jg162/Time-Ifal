import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sessão encerrada com sucesso.'
  });
  clearAuthCookie(response);
  return response;
}
