import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getTeamByCode, addUserToTeam } from '@/lib/db';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensureSeedData();
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso não autorizado. Faça login primeiro.' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Informe o código do time.' }, { status: 400 });
    }

    const team = await getTeamByCode(code.trim());
    if (!team) {
      return NextResponse.json({ error: 'Nenhum time encontrado com esse código.' }, { status: 404 });
    }

    await addUserToTeam(currentUser.id, team.id, 'atleta');

    return NextResponse.json({
      success: true,
      message: `Você entrou no time ${team.name}!`,
      team,
    });
  } catch (err: any) {
    console.error('Error joining team:', err);
    return NextResponse.json({ error: 'Erro ao entrar no time. Tente novamente.' }, { status: 500 });
  }
}
