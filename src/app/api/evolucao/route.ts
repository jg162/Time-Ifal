import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { getEvaluationsByUserId } from '@/lib/db';
import { EvolutionMetric, EvolutionResponse, MetricSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

const METRIC_DEFS = [
  { key: 'height', label: 'Altura', unit: 'cm', get: (e: any) => e.height || null },
  { key: 'weight', label: 'Peso', unit: 'kg', get: (e: any) => e.weight || null },
  { key: 'wingspan', label: 'Envergadura', unit: 'cm', get: (e: any) => e.wingspan || null },
  { key: 'seated_height', label: 'Altura Sentado', unit: 'cm', get: (e: any) => e.seated_height ?? null },
  { key: 'reach_standing', label: 'Alcance Vertical Parado', unit: 'cm', get: (e: any) => e.reach_standing || null },
  { key: 'reach_jumping', label: 'Alcance Vertical Pulando', unit: 'cm', get: (e: any) => e.reach_jumping || null },
  { key: 'vertical_jump', label: 'Salto Vertical', unit: 'cm', get: (e: any) => e.vertical_jump || null },
  { key: 'attack_reach', label: 'Alcance de Ataque', unit: 'cm', get: (e: any) => e.attack_reach ?? null },
  { key: 'block_reach', label: 'Alcance de Bloqueio', unit: 'cm', get: (e: any) => e.block_reach ?? null },
] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const evaluations = await getEvaluationsByUserId(user.id); // histórico completo, preservado
    const periodParam = request.nextUrl.searchParams.get('periodo'); // meses: '' = tudo

    const evaluationsForPeriod = filterByPeriod(evaluations, periodParam ? parseInt(periodParam, 10) : null);
    const chartStartTime = evaluationsForPeriod.length > 0
      ? evaluationsForPeriod.map(e => e.evaluation_date).sort()[0]
      : null;

    const metrics: EvolutionMetric[] = METRIC_DEFS.map(def => {
      const points = evaluationsForPeriod
        .map(e => {
          const raw = def.get(e);
          if (raw === null || raw === undefined) return null;
          const value = Math.round(Number(raw) * 10) / 10;
          return value > 0 ? { date: e.evaluation_date, value } : null;
        })
        .filter((p): p is { date: string; value: number } => p !== null);

      return {
        key: def.key,
        label: def.label,
        unit: def.unit,
        points,
        summary: buildSummary(points),
      };
    });

    const response: EvolutionResponse & { filteredByDate: boolean } = {
      metrics,
      evaluationCount: evaluationsForPeriod.length,
      periodMonths: periodParam ? parseInt(periodParam, 10) : null,
      filteredByDate: Boolean(chartStartTime),
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Get evolution error:', err);
    return NextResponse.json({ error: 'Erro ao gerar evolução de métricas.' }, { status: 500 });
  }
}

function filterByPeriod(evals: { evaluation_date: string }[], months: number | null) {
  if (!months || months <= 0) return evals;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return evals.filter(e => e.evaluation_date >= cutoffStr);
}

function buildSummary(points: { date: string; value: number }[]): MetricSummary {
  if (points.length === 0) {
    return { first: null, latest: null, best: null, difference: null };
  }
  const first = points[0];
  const latest = points[points.length - 1];
  const best = points.reduce((bestP, p) => (p.value > bestP.value ? p : bestP), points[0]);
  return {
    first: { ...first },
    latest: { ...latest },
    best: { ...best },
    difference: Math.round((latest.value - first.value) * 10) / 10,
  };
}
