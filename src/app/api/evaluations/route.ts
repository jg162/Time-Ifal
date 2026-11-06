import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { createEvaluation, getEvaluationsByUserId } from '@/lib/db';
import { calculateAllMetrics } from '@/lib/calculations';
import { Position, ServeType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const evaluations = getEvaluationsByUserId(user.id);
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
      position,
      serve_types,
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
        { error: 'Todas as medidas físicas devem ser números válidos maiores que zero.' },
        { status: 400 }
      );
    }

    if (parsedJumping < parsedStanding) {
      return NextResponse.json(
        { error: 'O alcance vertical pulando deve ser maior ou igual ao alcance vertical parado.' },
        { status: 400 }
      );
    }

    // Calculations
    const metrics = calculateAllMetrics(
      birth_date,
      parsedWeight,
      parsedHeight,
      parsedStanding,
      parsedJumping,
      evaluation_date
    );

    const evalId = 'eval_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    const newEval = createEvaluation({
      id: evalId,
      user_id: user.id,
      evaluation_date,
      full_name: full_name.trim(),
      birth_date,
      age: metrics.age,
      weight: Math.round(parsedWeight * 10) / 10,
      height: Math.round(parsedHeight * 10) / 10,
      reach_standing: Math.round(parsedStanding * 10) / 10,
      reach_jumping: Math.round(parsedJumping * 10) / 10,
      wingspan: Math.round(parsedWingspan * 10) / 10,
      vertical_jump: metrics.vertical_jump,
      bmi: metrics.bmi,
      position: position as Position,
      serve_types: Array.isArray(serve_types) ? (serve_types as ServeType[]) : [],
      goals: goals ? goals.trim() : '',
      notes: notes ? notes.trim() : ''
    });

    return NextResponse.json({
      success: true,
      message: 'Avaliação física registrada com sucesso no histórico!',
      evaluation: newEval,
      metrics
    });
  } catch (err: any) {
    console.error('Create evaluation error:', err);
    return NextResponse.json(
      { error: 'Erro ao registrar avaliação.' },
      { status: 500 }
    );
  }
}
