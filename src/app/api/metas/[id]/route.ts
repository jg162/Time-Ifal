import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { updateGoal, deleteGoal, getGoalsByUserId, getEvaluationsByUserId } from '@/lib/db';
import { evaluateAchievements } from '@/lib/achievements';
import { GoalStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, metric_type, current_value, target_value, deadline, status, progress_pct } = body;

    if (status && !['ativo', 'concluido', 'cancelado'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }
    if (metric_type !== undefined && metric_type !== null && metric_type !== '' &&
        !['attack_reach', 'block_reach', 'vertical_jump', 'reach_jumping', 'wingspan', 'height', 'weight', 'tecnica'].includes(metric_type)) {
      return NextResponse.json({ error: 'Tipo de métrica inválido.' }, { status: 400 });
    }

    const parsedTarget = target_value === undefined || target_value === null || target_value === ''
      ? undefined
      : parseFloat(target_value);
    const parsedCurrent = current_value === undefined || current_value === null || current_value === ''
      ? undefined
      : parseFloat(current_value);

    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json({ error: 'Informe um título para a meta.' }, { status: 400 });
    }

    const goal = await updateGoal(params.id, user.id, {
      title,
      description: typeof description === 'string' ? description : undefined,
      metric_type: metric_type === '' ? null : metric_type,
      current_value: parsedCurrent,
      target_value: parsedTarget,
      deadline: deadline === '' ? null : deadline,
      status: status as GoalStatus | undefined,
      progress_pct: progress_pct !== undefined ? Number(progress_pct) : undefined,
    });

    if (!goal) {
      return NextResponse.json({ error: 'Meta não encontrada.' }, { status: 404 });
    }

    const { unlockedNow } = await evaluateAchievements(user.id, {
      evaluations: await getEvaluationsByUserId(user.id),
      goals: await getGoalsByUserId(user.id),
    });

    return NextResponse.json({
      success: true,
      message: 'Meta atualizada com sucesso!',
      goal,
      unlockedNow,
    });
  } catch (err: any) {
    console.error('Update goal error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar meta.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const success = await deleteGoal(params.id, user.id); // RLS: apenas o dono pode excluir
    if (!success) {
      return NextResponse.json({ error: 'Meta não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Meta excluída com sucesso.' });
  } catch (err: any) {
    console.error('Delete goal error:', err);
    return NextResponse.json({ error: 'Erro ao excluir meta.' }, { status: 500 });
  }
}
