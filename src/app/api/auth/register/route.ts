import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { ensureSeedData } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    await ensureSeedData();
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'A confirmação de senha não confere.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de e-mail inválido.' },
        { status: 400 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado na plataforma.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const newUser = await createUser({
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password_hash: passwordHash,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
    });

    const token = signToken(newUser);
    const response = NextResponse.json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar_url: newUser.avatar_url,
      }
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'Erro ao processar cadastro. Tente novamente mais tarde.' },
      { status: 500 }
    );
  }
}
