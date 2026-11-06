import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getAllTeamAthletes } from '@/lib/db';
import { ensureSeedData } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();
    const currentUser = await getCurrentUserFromRequest(request);
    const athletes = await getAllTeamAthletes(currentUser?.id);

    return NextResponse.json({
      athletes,
      currentUserId: currentUser?.id || null
    });
  } catch (err: any) {
    console.error('Get team athletes error:', err);
    return NextResponse.json({ error: 'Erro ao buscar atletas do time.' }, { status: 500 });
  }
}
