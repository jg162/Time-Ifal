import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getAthleteDetails } from '@/lib/db';
import { ensureSeedData } from '@/lib/seed';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSeedData();
    const currentUser = await getCurrentUserFromRequest(request);
    const details = await getAthleteDetails(params.id, currentUser?.id);

    if (!details) {
      return NextResponse.json({ error: 'Atleta não encontrado no time.' }, { status: 404 });
    }

    return NextResponse.json({
      athlete: details.athlete,
      evaluations: details.evaluations,
      isSelf: currentUser?.id === details.athlete.id
    });
  } catch (err: any) {
    console.error('Get athlete details error:', err);
    return NextResponse.json({ error: 'Erro ao carregar detalhes do atleta.' }, { status: 500 });
  }
}
