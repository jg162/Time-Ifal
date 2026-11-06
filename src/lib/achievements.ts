import { AchievementDef, AchievementKey, AchievementView, Evaluation, Goal } from '@/lib/types';
import { getAchievementsByUserId, unlockAchievements } from '@/lib/db';

// Única fonte de verdade das medalhas. A ordem define a exibição em /conquistas.
export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    key: 'first_evaluation',
    title: 'Primeira Avaliação',
    description: 'Registrou a primeira avaliação física na plataforma.',
    icon: 'clipboard',
    tier: 'bronze',
  },
  {
    key: 'five_evaluations',
    title: 'Dedicação',
    description: 'Registrado com 5 avaliações físicas no histórico.',
    icon: 'repeat',
    tier: 'prata',
  },
  {
    key: 'ten_evaluations',
    title: 'Atleta Comprometido',
    description: 'Registrado com 10 avaliações físicas no histórico.',
    icon: 'medal',
    tier: 'ouro',
  },
  {
    key: 'first_goal',
    title: 'Sonhador',
    description: 'Cadastrou a primeira meta individual na plataforma.',
    icon: 'target',
    tier: 'bronze',
  },
  {
    key: 'first_goal_completed',
    title: 'Realizador',
    description: 'Concluiu a primeira meta individual cadastrada.',
    icon: 'trophy',
    tier: 'ouro',
  },
  {
    key: 'jump_record',
    title: 'Novo Recorde de Salto',
    description: 'Superou o recorde pessoal de salto vertical.',
    icon: 'zap',
    tier: 'prata',
  },
  {
    key: 'attack_record',
    title: 'Novo Recorde de Ataque',
    description: 'Superou o recorde pessoal de alcance de ataque.',
    icon: 'arrow-up',
    tier: 'prata',
  },
  {
    key: 'block_record',
    title: 'Novo Recorde de Bloqueio',
    description: 'Superou o recorde pessoal de alcance de bloqueio.',
    icon: 'shield',
    tier: 'bronze',
  },
];

export function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.key === key);
}

export function toAchievementViews(
  unlocked: { key: AchievementKey; unlocked_at: string }[]
): AchievementView[] {
  return ACHIEVEMENT_DEFINITIONS.map(def => {
    const found = unlocked.find(u => u.key === def.key);
    return {
      ...def,
      unlocked: Boolean(found),
      unlocked_at: found?.unlocked_at ?? null,
    };
  });
}

/**
 * Critérios objetivos de desbloqueio:
 * - first_evaluation: >= 1 avaliação
 * - five_evaluations: >= 5 avaliações
 * - ten_evaluations: >= 10 avaliações
 * - first_goal: >= 1 meta cadastrada
 * - first_goal_completed: >= 1 meta com status concluido
 * - jump_record / attack_record / block_record: a avaliação mais recente
 *   supera TODAS as anteriores registradas para a mesma medida.
 */
export function computeCandidateKeys(
  context: { evaluations: Evaluation[]; goals: Goal[] }
): AchievementKey[] {
  const { evaluations, goals } = context;
  const keys: AchievementKey[] = [];

  if (evaluations.length >= 1) keys.push('first_evaluation');
  if (evaluations.length >= 5) keys.push('five_evaluations');
  if (evaluations.length >= 10) keys.push('ten_evaluations');
  if (goals.length >= 1) keys.push('first_goal');
  if (goals.some(g => g.status === 'concluido')) keys.push('first_goal_completed');

  if (evaluations.length > 0) {
    const evalsSorted = [...evaluations].sort(
      (a, b) => a.evaluation_date.localeCompare(b.evaluation_date) || a.created_at.localeCompare(b.created_at)
    );
    const latest = evalsSorted[evalsSorted.length - 1];
    const previous = evalsSorted.slice(0, -1);

    const recordAchieved = (getVal: (e: Evaluation) => number | null): boolean => {
      const current = getVal(latest);
      if (current === null || current === undefined) return false;
      return previous.every(e => {
        const v = getVal(e);
        return v === null || v === undefined || current > v;
      });
    };

    if (recordAchieved(e => e.vertical_jump)) keys.push('jump_record');
    if (recordAchieved(e => e.attack_reach)) keys.push('attack_record');
    if (recordAchieved(e => e.block_reach)) keys.push('block_record');
  }

  return keys;
}

/**
 * Avalia as conquistas de um atleta e desbloqueia automaticamente as
 * que ainda não foram registradas. Chamado após criar avaliação, alterar
 * metas e ao carregar a página de conquistas.
 */
export async function evaluateAchievements(
  userId: string,
  context: { evaluations: Evaluation[]; goals: Goal[] }
): Promise<{ unlockedNow: AchievementKey[]; all: AchievementView[] }> {
  const existing = await getAchievementsByUserId(userId);
  const existingKeys = new Set(existing.map(a => a.key));

  const candidates = computeCandidateKeys(context);
  const newKeys = candidates.filter(k => !existingKeys.has(k));

  if (newKeys.length > 0) {
    const justUnlocked = await unlockAchievements(userId, newKeys);
    for (const u of justUnlocked) existing.push(u);
  }

  return { unlockedNow: newKeys, all: toAchievementViews(existing) };
}
