import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { deleteEvaluation, getEvaluationById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const evaluation = await getEvaluationById(params.id, user.id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ evaluation });
  } catch (err: any) {
    console.error('Get evaluation by id error:', err);
    return NextResponse.json({ error: 'Erro ao buscar avaliação.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const success = await deleteEvaluation(params.id, user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada ou você não tem permissão para excluí-la.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avaliação excluída com sucesso do histórico.'
    });
  } catch (err: any) {
    console.error('Delete evaluation error:', err);
    return NextResponse.json({ error: 'Erro ao excluir avaliação.' }, { status: 500 });
  }
}
