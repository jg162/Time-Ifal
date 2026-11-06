import { NextRequest, NextResponse } from 'next/server';
import { ensureSeedData } from '@/lib/seed';
import { getRanking } from '@/lib/db';
import { RankingCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CATEGORIES: RankingCategory[] = ['reach_jumping', 'vertical_jump', 'attack_reach', 'block_reach', 'height', 'wingspan'];

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();

    const requested = request.nextUrl.searchParams.get('categoria');
    const fields = requested && CATEGORIES.includes(requested as RankingCategory)
      ? [requested as RankingCategory]
      : CATEGORIES;

    const rankings: Record<string, unknown> = {};
    for (const field of fields) {
      rankings[field] = await getRanking(field, 100);
    }

    return NextResponse.json({
      rankings,
      // A consulta usa SEMPRE a avaliação mais recente de cada atleta.
      note: 'Rankings calculados a partir da avaliação mais recente de cada atleta, atualizados automaticamente a cada novo registro.',
    });
  } catch (err: any) {
    console.error('Get rankings error:', err);
    return NextResponse.json({ error: 'Erro ao calcular rankings.' }, { status: 500 });
  }
}
