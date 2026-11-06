import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, comparePassword, hashPassword } from '@/lib/auth';
import { getUserByEmail, updateUserPassword } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Informe a senha atual e a nova senha.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
    }
    if (confirmPassword !== undefined && confirmPassword !== null && confirmPassword !== '' && newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'A confirmação de senha não confere.' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'A nova senha deve ser diferente da senha atual.' }, { status: 400 });
    }

    const fullUser = await getUserByEmail(user.email);
    if (!fullUser) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    const ok = await comparePassword(currentPassword, fullUser.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 403 });
    }

    const hash = await hashPassword(newPassword); // nunca armazenamos a senha em texto
    await updateUserPassword(fullUser.id, hash);

    return NextResponse.json({ success: true, message: 'Senha alterada com sucesso!' });
  } catch (err: any) {
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Erro ao alterar senha.' }, { status: 500 });
  }
}
