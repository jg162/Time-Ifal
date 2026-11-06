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
  serve_types: ServeType[];
  bio_goals?: string | null;
  show_weight: boolean;
  show_height: boolean;
  show_reach: boolean;
  show_wingspan: boolean;
  show_goals: boolean;
  show_evaluations: boolean;
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
  wingspan: number; // in cm
  vertical_jump: number; // calculated: reach_jumping - reach_standing
  bmi: number; // calculated: weight / (height/100)^2
  position: Position;
  serve_types: ServeType[];
  goals: string;
  notes?: string;
  created_at: string;
}

export interface TeamAthlete {
  id: string;
  name: string;
  avatar_url?: string | null;
  position: Position;
  birth_date?: string | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  reach_standing?: number | null;
  reach_jumping?: number | null;
  wingspan?: number | null;
  vertical_jump?: number | null;
  bmi?: number | null;
  serve_types: ServeType[];
  goals?: string | null;
  last_updated?: string | null;
  evaluations_count: number;
  privacy: {
    show_weight: boolean;
    show_height: boolean;
    show_reach: boolean;
    show_wingspan: boolean;
    show_goals: boolean;
    show_evaluations: boolean;
  };
}

export interface CalculationResult {
  age: number;
  vertical_jump: number;
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
