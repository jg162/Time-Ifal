import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getProfileByUserId } from '@/lib/db';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { ensureSeedData } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    await ensureSeedData();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Informe e-mail e senha para continuar.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email.trim());
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    const passwordMatches = await comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    const token = signToken(user);
    const profile = await getProfileByUserId(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Login efetuado com sucesso!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
      profile
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Erro interno ao realizar login. Tente novamente.' },
      { status: 500 }
    );
  }
}
