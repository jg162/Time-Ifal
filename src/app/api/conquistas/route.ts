import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getGoalsByUserId, getEvaluationsByUserId } from '@/lib/db';
import { evaluateAchievements } from '@/lib/achievements';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Recalcula automaticamente os critérios de desbloqueio ao acessar a página.
    const { all, unlockedNow } = await evaluateAchievements(user.id, {
      evaluations: await getEvaluationsByUserId(user.id),
      goals: await getGoalsByUserId(user.id),
    });

    return NextResponse.json({ achievements: all, unlockedNow });
  } catch (err: any) {
    console.error('Get achievements error:', err);
    return NextResponse.json({ error: 'Erro ao buscar conquistas.' }, { status: 500 });
  }
}
