import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, clearAuthCookie } from '@/lib/auth';
import { getProfileByUserId, updateProfile, deleteUserAccount, getUserById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const profile = await getProfileByUserId(user.id);
    return NextResponse.json({ user, profile });
  } catch (err: any) {
    console.error('Get profile error:', err);
    return NextResponse.json({ error: 'Erro ao carregar perfil.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const updatedProfile = await updateProfile(user.id, body);
    const refreshedUser = await getUserById(user.id);

    return NextResponse.json({
      success: true,
      message: 'Perfil e configurações atualizados com sucesso!',
      profile: updatedProfile,
      user: refreshedUser
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar perfil.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const ok = await deleteUserAccount(user.id);
    if (!ok) {
      return NextResponse.json({ error: 'Falha ao excluir a conta.' }, { status: 500 });
    }

    const res = NextResponse.json({
      success: true,
      message: 'Sua conta e todos os seus dados foram excluídos com sucesso em conformidade com a LGPD.'
    });
    clearAuthCookie(res);
    return res;
  } catch (err: any) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Erro ao excluir conta.' }, { status: 500 });
  }
}
