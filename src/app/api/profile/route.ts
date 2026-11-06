import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getProfileByUserId, updateProfile } from '@/lib/db';

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

    return NextResponse.json({
      success: true,
      message: 'Perfil e configurações atualizados com sucesso!',
      profile: updatedProfile
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 });
  }
}
