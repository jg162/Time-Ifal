import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getProfileByUserId, getEvaluationsByUserId, getGoalsByUserId, getAchievementsByUserId, getPublicCardBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const profile = getProfileByUserId(user.id);
    const evaluations = getEvaluationsByUserId(user.id);
    const latestEvaluation = evaluations.length > 0 ? evaluations[evaluations.length - 1] : null;
    const goals = getGoalsByUserId(user.id);
    const unlockedAchievements = getAchievementsByUserId(user.id);

    return NextResponse.json({
      profile,
      latestEvaluation,
      evaluationsCount: evaluations.length,
      goalsTotal: goals.length,
      goalsCompleted: goals.filter(g => g.status === 'concluido').length,
      unlockedAchievements,
    });
  } catch (err: any) {
    console.error('Get carteirinha error:', err);
    return NextResponse.json({ error: 'Erro ao carregar carteirinha.' }, { status: 500 });
  }
}

/**
 * Ativa/desativa o link público da carteirinha. O próprio atleta controla
 * se o link existe (public_card_enabled) e o seu endereço (slug).
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const profile = getProfileByUserId(user.id);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    const profileUpdate = (await import('@/lib/db')).updateProfile;
    const updated = profileUpdate(user.id, {
      public_card_enabled: Boolean(body.public_card_enabled),
      ...(body.public_card_slug !== undefined && body.public_card_slug !== null
        ? { public_card_slug: body.public_card_slug }
        : {}),
    });

    return NextResponse.json({
      success: true,
      message: updated.public_card_enabled
        ? 'Link público ativado. Copie abaixo para compartilhar sua carteirinha.'
        : 'Link público desativado. Sua carteirinha não é mais acessível.',
      profile: updated,
      publicUrl: updated.public_card_enabled && updated.public_card_slug
        ? `${request.nextUrl.origin}/cartao/${updated.public_card_slug}`
        : null,
    });
  } catch (err: any) {
    console.error('Update carteirinha error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar o compartilhamento.' }, { status: 500 });
  }
}
