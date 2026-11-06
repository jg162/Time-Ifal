import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  createEvaluation,
  getEvaluationsByUserId,
  getGoalsByUserId,
  syncGoalsWithLatestEvaluation,
} from '@/lib/db';
import { evaluateAchievements } from '@/lib/achievements';
import { calculateAllMetrics } from '@/lib/calculations';
import { LATERALITIES, Laterality, Position, ServeType } from '@/lib/types';

export const dynamic = 'force-dynamic';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const evaluations = await getEvaluationsByUserId(user.id);
    return NextResponse.json({ evaluations });
  } catch (err: any) {
    console.error('Get evaluations error:', err);
    return NextResponse.json({ error: 'Erro ao buscar avaliações.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      evaluation_date,
      full_name,
      birth_date,
      weight,
      height,
      reach_standing,
      reach_jumping,
      wingspan,
      seated_height,
      attack_reach,
      block_reach,
      laterality,
      position,
      serve_types,
      practice_time,
      goals,
      notes
    } = body;

    // Field validation
    if (!evaluation_date || !full_name || !birth_date || !position) {
      return NextResponse.json(
        { error: 'Por favor, preencha todos os dados pessoais e data da avaliação.' },
        { status: 400 }
      );
    }

    const parsedWeight = parseFloat(weight);
    const parsedHeight = parseFloat(height);
    const parsedStanding = parseFloat(reach_standing);
    const parsedJumping = parseFloat(reach_jumping);
    const parsedWingspan = parseFloat(wingspan);

    if (
      isNaN(parsedWeight) || parsedWeight <= 0 ||
      isNaN(parsedHeight) || parsedHeight <= 0 ||
      isNaN(parsedStanding) || parsedStanding <= 0 ||
      isNaN(parsedJumping) || parsedJumping <= 0 ||
      isNaN(parsedWingspan) || parsedWingspan <= 0
    ) {
      return NextResponse.json(
        { error: 'Todas as medidas físicas obrigatórias devem ser números válidos maiores que zero.' },
        { status: 400 }
      );
    }

    if (parsedJumping < parsedStanding) {
      return NextResponse.json(
        { error: 'O alcance vertical pulando deve ser maior ou igual ao alcance vertical parado.' },
        { status: 400 }
      );
    }

    if (isNaN(new Date(evaluation_date).getTime())) {
      return NextResponse.json({ error: 'Data da avaliação inválida.' }, { status: 400 });
    }

    // Optional fields (only stored when > 0)
    const parseOptional = (v: any): number | null => {
      if (v === undefined || v === null || v === '') return null;
      const n = parseFloat(v);
      return isNaN(n) || n <= 0 ? null : round1(n);
    };
    const parsedSeated = parseOptional(seated_height);
    const parsedAttack = parseOptional(attack_reach);
    const parsedBlock = parseOptional(block_reach);

    // Lateralidade normalization (Destro | Canhoto | Ambidestro)
    let parsedLaterality: Laterality | null = null;
    if (laterality) {
      const match = LATERALITIES.find(
        l => l.toLowerCase() === String(laterality).toLowerCase()
      );
      parsedLaterality = match ?? null;
    }

    // Calculations
    const metrics = calculateAllMetrics(
      birth_date,
      parsedWeight,
      parsedHeight,
      parsedStanding,
      parsedJumping,
      evaluation_date,
      parsedAttack,
      parsedBlock
    );

    const evalId = 'eval_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const goalsText = goals ? goals.trim() : '';

    const newEval = await createEvaluation({
      id: evalId,
      user_id: user.id,
      evaluation_date,
      full_name: full_name.trim(),
      birth_date,
      age: metrics.age,
      weight: round1(parsedWeight),
      height: round1(parsedHeight),
      reach_standing: round1(parsedStanding),
      reach_jumping: round1(parsedJumping),
      wingspan: round1(parsedWingspan),
      seated_height: parsedSeated,
      attack_reach: parsedAttack,
      block_reach: parsedBlock,
      laterality: parsedLaterality,
      practice_time: typeof practice_time === 'string' ? practice_time.trim() : '',
      vertical_jump: metrics.vertical_jump,
      bmi: metrics.bmi,
      position: position as Position,
      serve_types: Array.isArray(serve_types) ? (serve_types as ServeType[]) : [],
      goals: goalsText,
      notes: notes ? notes.trim() : ''
    });

    // Metas mensuráveis passam a refletir automaticamente a avaliação mais recente.
    await syncGoalsWithLatestEvaluation(user.id);

    // Desbloqueio automático de conquistas (1ª avaliação, recordes, etc.)
    const { unlockedNow } = await evaluateAchievements(user.id, {
      evaluations: await getEvaluationsByUserId(user.id),
      goals: await getGoalsByUserId(user.id),
    });

    return NextResponse.json({
      success: true,
      message: 'Avaliação física registrada com sucesso no histórico!',
      evaluation: newEval,
      metrics,
      unlockedNow,
    });
  } catch (err: any) {
    console.error('Create evaluation error:', err);
    return NextResponse.json(
      { error: 'Erro ao registrar avaliação.' },
      { status: 500 }
    );
  }
}
