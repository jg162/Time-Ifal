import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getUserTeam, removeUserFromTeam } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso não autorizado. Faça login primeiro.' }, { status: 401 });
    }

    const team = await getUserTeam(currentUser.id);
    if (!team) {
      return NextResponse.json({ error: 'Você não está vinculado a nenhum time no momento.' }, { status: 400 });
    }

    await removeUserFromTeam(currentUser.id, team.id);

    return NextResponse.json({
      success: true,
      message: `Você saiu do time ${team.name} com sucesso.`
    });
  } catch (err: any) {
    console.error('Error leaving team:', err);
    return NextResponse.json({ error: 'Erro ao sair do time. Tente novamente.' }, { status: 500 });
  }
}
