import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { createTeam, getTeamByCode, getUserTeam } from '@/lib/db';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';

function getAppUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  const host = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // 1. Consulta pública por código de convite
    if (code) {
      const team = await getTeamByCode(code);
      if (!team) {
        return NextResponse.json({ error: 'Time não encontrado com este código.' }, { status: 404 });
      }
      return NextResponse.json({ team });
    }

    // 2. Consulta do time do usuário logado
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ team: null });
    }

    const team = await getUserTeam(currentUser.id);
    const appUrl = getAppUrl(request);
    const inviteLink = team ? `${appUrl}/cadastro?team=${team.code}` : null;

    return NextResponse.json({
      team,
      inviteLink,
      currentUserId: currentUser.id,
    });
  } catch (err: any) {
    console.error('Error in GET /api/teams:', err);
    return NextResponse.json({ error: 'Erro ao consultar time.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeedData();
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso não autorizado. Faça login primeiro.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'O nome do time deve ter no mínimo 2 caracteres.' }, { status: 400 });
    }

    const team = await createTeam(name.trim(), description || '', currentUser.id);
    const appUrl = getAppUrl(request);
    const inviteLink = `${appUrl}/cadastro?team=${team.code}`;

    return NextResponse.json({
      success: true,
      message: 'Time criado com sucesso!',
      team,
      inviteLink,
    });
  } catch (err: any) {
    console.error('Error creating team:', err);
    return NextResponse.json({ error: 'Erro ao criar time. Tente novamente.' }, { status: 500 });
  }
}
