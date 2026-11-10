import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getTeamByCode, addUserToTeam, getUserTeam } from '@/lib/db';
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
      return NextResponse.json({ error: 'Nenhum time encontrado com esse código de convite.' }, { status: 404 });
    }

    const existingTeam = await getUserTeam(currentUser.id);
    if (existingTeam) {
      if (existingTeam.id === team.id) {
        return NextResponse.json({ error: 'Você já faz parte desta equipe!' }, { status: 400 });
      }
      return NextResponse.json({
        error: `Você já está vinculado ao time "${existingTeam.name}". Saia da sua equipe atual antes de entrar em outra.`
      }, { status: 400 });
    }

    await addUserToTeam(currentUser.id, team.id, 'atleta');

    return NextResponse.json({
      success: true,
      message: `Você entrou no time ${team.name} com sucesso!`,
      team,
    });
  } catch (err: any) {
    console.error('Error joining team:', err);
    return NextResponse.json({ error: 'Erro ao entrar no time. Tente novamente.' }, { status: 500 });
  }
}
