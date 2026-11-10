import { calculateAge, calculateVerticalJump, calculateBMI } from './calculations';

export type Position = 'Levantador' | 'Central' | 'Líbero' | 'Ponteiro' | 'Oposto';

export const POSITIONS: Position[] = [
  'Levantador',
  'Central',
  'Líbero',
  'Ponteiro',
  'Oposto'
];

export type ServeType =
  | 'Saque por baixo'
  | 'Saque por cima'
  | 'Flutuante parado'
  | 'Flutuante pulando'
  | 'Híbrido'
  | 'Viagem';

export const SERVE_TYPES: ServeType[] = [
  'Saque por baixo',
  'Saque por cima',
  'Flutuante parado',
  'Flutuante pulando',
  'Híbrido',
  'Viagem'
];

export type Laterality = 'Destro' | 'Canhoto' | 'Ambidestro';

export const LATERALITIES: Laterality[] = ['Destro', 'Canhoto', 'Ambidestro'];

export function labelLaterality(value: string | null | undefined): string {
  switch (value) {
    case 'destro':
    case 'Destro':
      return 'Destro';
    case 'canhoto':
    case 'Canhoto':
      return 'Canhoto';
    case 'ambidestro':
    case 'Ambidestro':
      return 'Ambidestro';
    default:
      return 'Não informado';
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface Profile {
  user_id: string;
  full_name: string;
  birth_date?: string | null;
  preferred_position: Position;
  laterality: Laterality | null;
  practice_time: string;
  serve_types: ServeType[];
  bio_goals?: string | null;
  height?: number | null;
  weight?: number | null;
  wingspan?: number | null;
  show_weight: boolean;
  show_height: boolean;
  show_reach: boolean;
  show_wingspan: boolean;
  show_goals: boolean;
  show_evaluations: boolean;
  show_in_rankings: boolean;
  public_card_enabled: boolean;
  public_card_slug: string | null;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  user_id: string;
  evaluation_date: string;
  full_name: string;
  birth_date: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  reach_standing: number; // in cm
  reach_jumping: number; // in cm
  wingspan: number; // envergadura in cm
  seated_height: number | null; // altura sentado in cm
  attack_reach: number | null; // alcance de ataque in cm
  block_reach: number | null; // alcance de bloqueio in cm
  laterality: Laterality | null;
  practice_time: string;
  vertical_jump: number; // calculated: reach_jumping - reach_standing
  bmi: number; // calculated: weight / (height_m)^2
  position: Position;
  serve_types: ServeType[];
  goals: string;
  notes?: string;
  created_at: string;
}

export interface RankingEntry {
  athlete_id: string;
  rank: number;
  name: string;
  avatar_url: string | null;
  position: Position;
  value: number;
  evaluation_date: string;
}

export type RankingCategory =
  | 'reach_jumping'
  | 'vertical_jump'
  | 'attack_reach'
  | 'block_reach'
  | 'height'
  | 'wingspan';

export const RANKING_CATEGORIES: { key: RankingCategory; label: string; description: string }[] = [
  { key: 'reach_jumping', label: 'Maior Alcance Vertical Pulando', description: 'Ponto mais alto tocado em salto, em centímetros.' },
  { key: 'vertical_jump', label: 'Maior Salto Vertical', description: 'Diferença entre alcance pulando e parado, em centímetros.' },
  { key: 'attack_reach', label: 'Maior Alcance de Ataque', description: 'Altura máxima de toque para ataque, em centímetros.' },
  { key: 'block_reach', label: 'Maior Alcance de Bloqueio', description: 'Altura máxima de toque para bloqueio, em centímetros.' },
  { key: 'height', label: 'Maior Altura', description: 'Altura corporal em centímetros.' },
  { key: 'wingspan', label: 'Maior Envergadura', description: 'Envergadura dos braços em centímetros.' },
];

export type CompareMetricKey =
  | 'age'
  | 'height'
  | 'weight'
  | 'wingspan'
  | 'reach_standing'
  | 'reach_jumping'
  | 'vertical_jump'
  | 'attack_reach'
  | 'block_reach';

export const COMPARE_METRICS: {
  key: CompareMetricKey;
  label: string;
  unit: string;
  higherIsBetter: boolean;
}[] = [
  { key: 'age', label: 'Idade', unit: 'anos', higherIsBetter: false },
  { key: 'height', label: 'Altura', unit: 'cm', higherIsBetter: true },
  { key: 'weight', label: 'Peso', unit: 'kg', higherIsBetter: false },
  { key: 'wingspan', label: 'Envergadura', unit: 'cm', higherIsBetter: true },
  { key: 'reach_standing', label: 'Alcance Vertical Parado', unit: 'cm', higherIsBetter: true },
  { key: 'reach_jumping', label: 'Alcance Vertical Pulando', unit: 'cm', higherIsBetter: true },
  { key: 'vertical_jump', label: 'Salto Vertical', unit: 'cm', higherIsBetter: true },
  { key: 'attack_reach', label: 'Alcance de Ataque', unit: 'cm', higherIsBetter: true },
  { key: 'block_reach', label: 'Alcance de Bloqueio', unit: 'cm', higherIsBetter: true },
];

export interface CompareAthlete {
  id: string;
  name: string;
  avatar_url: string | null;
  position: Position;
  age: number | null;
  height: number | null;
  weight: number | null;
  wingspan: number | null;
  reach_standing: number | null;
  reach_jumping: number | null;
  vertical_jump: number | null;
  attack_reach: number | null;
  block_reach: number | null;
  evaluation_date: string | null;
}

export interface MetricSummary {
  first: { date: string; value: number } | null;
  latest: { date: string; value: number } | null;
  best: { date: string; value: number } | null;
  difference: number | null;
}

export interface EvolutionMetricPoint {
  date: string;
  value: number;
}

export interface EvolutionMetric {
  key: string;
  label: string;
  unit: string;
  points: EvolutionMetricPoint[];
  summary: MetricSummary;
}

export interface EvolutionResponse {
  metrics: EvolutionMetric[];
  evaluationCount: number;
  periodMonths: number | null;
}

export type GoalStatus = 'ativo' | 'concluido' | 'cancelado';

export type GoalMetricType =
  | 'attack_reach'
  | 'block_reach'
  | 'vertical_jump'
  | 'reach_jumping'
  | 'wingspan'
  | 'height'
  | 'weight'
  | 'tecnica';

export const GOAL_METRIC_LABELS: Record<string, string> = {
  attack_reach: 'Alcance de Ataque',
  block_reach: 'Alcance de Bloqueio',
  vertical_jump: 'Salto Vertical',
  reach_jumping: 'Alcance Vertical Pulando',
  wingspan: 'Envergadura',
  height: 'Altura',
  weight: 'Peso',
  tecnica: 'Habilidade Técnica',
};

export const GOAL_METRIC_UNITS: Record<string, string> = {
  attack_reach: 'cm',
  block_reach: 'cm',
  vertical_jump: 'cm',
  reach_jumping: 'cm',
  wingspan: 'cm',
  height: 'cm',
  weight: 'kg',
  tecnica: '',
};

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  metric_type: GoalMetricType | null;
  current_value: number | null;
  target_value: number | null;
  deadline: string | null;
  status: GoalStatus;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export type AchievementKey =
  | 'first_evaluation'
  | 'five_evaluations'
  | 'ten_evaluations'
  | 'first_goal'
  | 'first_goal_completed'
  | 'jump_record'
  | 'attack_record'
  | 'block_record';

export interface AchievementDef {
  key: AchievementKey;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'prata' | 'ouro' | 'lendario';
}

export interface Achievement {
  key: AchievementKey;
  unlocked_at: string;
}

export interface AchievementView extends AchievementDef {
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  members_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'tecnico' | 'capitao' | 'atleta';
  joined_at: string;
}

export interface TeamAthlete {
  id: string;
  name: string;
  avatar_url?: string | null;
  position: Position;
  laterality: Laterality | null;
  birth_date?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  reach_standing?: number | null;
  reach_jumping?: number | null;
  wingspan?: number | null;
  vertical_jump?: number | null;
  attack_reach?: number | null;
  block_reach?: number | null;
  bmi?: number | null;
  serve_types: ServeType[];
  practice_time?: string | null;
  goals?: string | null;
  last_updated?: string | null;
  evaluations_count: number;
  is_self?: boolean;
  team_id?: string | null;
  team_name?: string | null;
  team_role?: string | null;
  privacy: {
    show_weight: boolean;
    show_height: boolean;
    show_reach: boolean;
    show_wingspan: boolean;
    show_goals: boolean;
    show_evaluations: boolean;
  };
}

export interface AthleteCardData {
  id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
  age: number | null;
  position: Position;
  height: number | null;
  wingspan: number | null;
  vertical_jump: number | null;
  attack_reach: number | null;
  block_reach: number | null;
  evaluation_date: string | null;
  unlocked_achievements: Achievement[];
}

export interface CalculationResult {
  age: number;
  vertical_jump: number;
  attack_reach: number | null;
  block_reach: number | null;
  bmi: number;
  bmi_category: {
    label: string;
    color: string;
  };
  jump_category: {
    label: string;
    color: string;
  };
}

// Re-export shared calculation helpers so every module (client pages,
// server routes and scripts) uses exactly the same math.
export const calculateAll = {
  age: calculateAge,
  verticalJump: calculateVerticalJump,
  bmi: calculateBMI,
};
