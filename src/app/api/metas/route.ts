import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { createGoal, getGoalsByUserId, getEvaluationsByUserId } from '@/lib/db';
import { evaluateAchievements } from '@/lib/achievements';
import { GoalMetricType, GoalStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

const METRIC_TYPES: GoalMetricType[] = ['attack_reach', 'block_reach', 'vertical_jump', 'reach_jumping', 'wingspan', 'height', 'weight', 'tecnica'];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const goals = getGoalsByUserId(user.id);
    return NextResponse.json({ goals });
  } catch (err: any) {
    console.error('Get goals error:', err);
    return NextResponse.json({ error: 'Erro ao buscar metas.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, metric_type, target_value, current_value, deadline, status } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Informe um título para a meta.' }, { status: 400 });
    }

    if (metric_type !== undefined && metric_type !== null && metric_type !== '' && !METRIC_TYPES.includes(metric_type)) {
      return NextResponse.json({ error: 'Tipo de métrica inválido.' }, { status: 400 });
    }

    const parsedTarget = target_value === undefined || target_value === null || target_value === ''
      ? null
      : parseFloat(target_value);
    const parsedCurrent = current_value === undefined || current_value === null || current_value === ''
      ? null
      : parseFloat(current_value);

    if (parsedTarget !== null && (isNaN(parsedTarget) || parsedTarget <= 0)) {
      return NextResponse.json({ error: 'O valor desejado deve ser um número positivo.' }, { status: 400 });
    }
    if (parsedCurrent !== null && (isNaN(parsedCurrent) || parsedCurrent < 0)) {
      return NextResponse.json({ error: 'O valor atual deve ser um número válido.' }, { status: 400 });
    }
    if (deadline && isNaN(new Date(deadline).getTime())) {
      return NextResponse.json({ error: 'Data de prazo inválida.' }, { status: 400 });
    }

    const goal = createGoal(user.id, {
      title: title.trim(),
      description: typeof description === 'string' ? description : '',
      metric_type: metric_type || null,
      current_value: parsedCurrent,
      target_value: parsedTarget,
      deadline: deadline || null,
    });

    if (status && ['ativo', 'concluido', 'cancelado'].includes(status)) {
      void (await import('@/lib/db')).updateGoal(goal.id, user.id, { status: status as GoalStatus });
    }

    // A primeira meta criada desbloqueia uma conquista.
    const goals = getGoalsByUserId(user.id);
    const { unlockedNow } = await evaluateAchievements(user.id, {
      evaluations: getEvaluationsByUserId(user.id),
      goals,
    });

    return NextResponse.json({
      success: true,
      message: 'Meta cadastrada com sucesso!',
      goal,
      unlockedNow,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Create goal error:', err);
    return NextResponse.json({ error: 'Erro ao cadastrar meta.' }, { status: 500 });
  }
}
