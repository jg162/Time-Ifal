import { NextRequest, NextResponse } from 'next/server';
import { getAllTeamAthletes, getUserById } from '@/lib/db';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { CompareAthlete } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Retorna osperfis comparáveis (dados da avaliação MAIS RECENTE de cada
 * atleta, respeitando as toggles de privacidade de cada um).
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);

   const idsParam = request.nextUrl.searchParams.get('ids') || '';
    let ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);

    // Um atleta sempre pode se incluir na comparação mesmo com privacidade on.
    if (ids.length > 10) ids = ids.slice(0, 10);

    const athletes = await getAllTeamAthletes(currentUser?.id);

    const comparable: CompareAthlete[] = athletes
      .filter(a => (ids.length > 0 ? ids.includes(a.id) : true))
      .map(a => ({
        id: a.id,
        name: a.name,
        avatar_url: a.avatar_url ?? null,
        position: a.position,
        age: a.age ?? null,
        height: a.height ?? null,
        weight: a.weight ?? null,
        wingspan: a.wingspan ?? null,
        reach_standing: a.reach_standing ?? null,
        reach_jumping: a.reach_jumping ?? null,
        vertical_jump: a.vertical_jump ?? null,
        attack_reach: a.attack_reach ?? null,
        block_reach: a.block_reach ?? null,
        evaluation_date: a.last_updated ?? null,
      }));

    return NextResponse.json({
      athletes: comparable,
      allAthletes: athletes.map(a => ({
        id: a.id,
        name: a.name,
        avatar_url: a.avatar_url ?? null,
        position: a.position,
        is_self: a.is_self ?? currentUser?.id === a.id,
      })),
      currentUserId: currentUser?.id ?? null,
    });
  } catch (err: any) {
    console.error('Compare athletes error:', err);
    return NextResponse.json({ error: 'Erro ao buscar atletas para comparação.' }, { status: 500 });
  }
}
