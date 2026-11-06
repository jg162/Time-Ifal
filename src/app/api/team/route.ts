import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getAllTeamAthletes, getUserTeam } from '@/lib/db';
import { ensureSeedData } from '@/lib/seed';
import type { TeamAthlete } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getAppUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  const host = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();
    const currentUser = await getCurrentUserFromRequest(request);

    let userTeam = null;
    let inviteLink = null;
    let athletes: TeamAthlete[] = [];

    if (currentUser) {
      userTeam = await getUserTeam(currentUser.id);
      if (userTeam) {
        const appUrl = getAppUrl(request);
        inviteLink = `${appUrl}/cadastro?team=${userTeam.code}`;
        athletes = await getAllTeamAthletes(currentUser.id, userTeam.id);
      }
    }

    return NextResponse.json({
      team: userTeam,
      inviteLink,
      athletes,
      currentUserId: currentUser?.id || null,
    });
  } catch (err: any) {
    console.error('Get team athletes error:', err);
    return NextResponse.json({ error: 'Erro ao buscar dados do time.' }, { status: 500 });
  }
}
