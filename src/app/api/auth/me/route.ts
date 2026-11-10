import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getProfileByUserId, getEvaluationsByUserId, getUserTeam } from '@/lib/db';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const profile = await getProfileByUserId(user.id);
    const evaluations = await getEvaluationsByUserId(user.id);
    const latestEvaluation = evaluations.length > 0 ? evaluations[evaluations.length - 1] : null;
    const team = await getUserTeam(user.id);

    return NextResponse.json({
      authenticated: true,
      user,
      profile,
      latestEvaluation,
      team,
      evaluationsCount: evaluations.length,
    });
  } catch (err: any) {
    console.error('Auth /me error:', err);
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação.' },
      { status: 500 }
    );
  }
}
