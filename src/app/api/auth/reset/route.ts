import { NextRequest, NextResponse } from 'next/server';
import { verifyAndUsePasswordReset } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword, confirmPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Preencha o e-mail, código de verificação e nova senha.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'A confirmação de senha não confere.' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);
    const success = await verifyAndUsePasswordReset(email.trim(), code.trim(), newPasswordHash);

    if (!success) {
      return NextResponse.json(
        { error: 'Código de recuperação inválido ou expirado.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso! Você já pode entrar com a nova senha.'
    });
  } catch (err: any) {
    console.error('Password reset error:', err);
    return NextResponse.json(
      { error: 'Erro ao redefinir senha.' },
      { status: 500 }
    );
  }
}
