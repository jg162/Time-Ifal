import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getUserTeam, updateTeam, removeUserFromTeam } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso não autorizado. Faça login primeiro.' }, { status: 401 });
    }

    const team = await getUserTeam(currentUser.id);
    if (!team) {
      return NextResponse.json({ error: 'Você não possui um time cadastrado.' }, { status: 404 });
    }

    // Apenas o criador/responsável pode editar as configurações do time
    if (team.created_by && team.created_by !== currentUser.id) {
      return NextResponse.json({ error: 'Apenas o capitão ou criador do time pode alterar estas configurações.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, renewCode } = body;

    let newCode: string | undefined = undefined;
    if (renewCode) {
      const prefix = (name || team.name).replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'TIME';
      const rand = Math.floor(1000 + Math.random() * 9000);
      newCode = `${prefix}-${rand}`;
    }

    const updated = await updateTeam(team.id, {
      name: name !== undefined ? name.trim() : undefined,
      description: description !== undefined ? description.trim() : undefined,
      code: newCode
    });

    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const appUrl = (envUrl && !envUrl.includes('localhost')) ? envUrl.replace(/\/+$/, '') : `${proto}://${host}`;
    const inviteLink = updated ? `${appUrl}/cadastro?team=${updated.code}` : null;

    return NextResponse.json({
      success: true,
      message: 'Time atualizado com sucesso!',
      team: updated,
      inviteLink
    });
  } catch (err: any) {
    console.error('Error updating team:', err);
    return NextResponse.json({ error: 'Erro ao atualizar dados do time.' }, { status: 500 });
  }
}

// Remover integrante (Kick)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const team = await getUserTeam(currentUser.id);
    if (!team) {
      return NextResponse.json({ error: 'Time não encontrado.' }, { status: 404 });
    }

    if (team.created_by && team.created_by !== currentUser.id) {
      return NextResponse.json({ error: 'Apenas o capitão pode remover membros do time.' }, { status: 403 });
    }

    const { memberId } = await request.json();
    if (!memberId) {
      return NextResponse.json({ error: 'Identificador do atleta é obrigatório.' }, { status: 400 });
    }

    if (memberId === currentUser.id) {
      return NextResponse.json({ error: 'O capitão não pode ser removido por esta ação.' }, { status: 400 });
    }

    await removeUserFromTeam(memberId, team.id);

    return NextResponse.json({
      success: true,
      message: 'Atleta removido do elenco com sucesso.'
    });
  } catch (err: any) {
    console.error('Error kicking member:', err);
    return NextResponse.json({ error: 'Erro ao remover atleta do time.' }, { status: 500 });
  }
}
