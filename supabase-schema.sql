-- VOLLEY PERFORMANCE · TIME IFAL
-- Esquema do banco de dados (PostgreSQL / Supabase)
-- Execute este SQL no SQL Editor do seu projeto Supabase.

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. USUÁRIOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || gen_random_uuid()::text),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 2. PERFIS (dados pessoais + controles de privacidade)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  preferred_position TEXT NOT NULL DEFAULT 'Ponteiro',
  laterality TEXT,
  practice_time TEXT DEFAULT '',
  serve_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  bio_goals TEXT DEFAULT '',
  height NUMERIC,
  weight NUMERIC,
  wingspan NUMERIC,
  show_weight BOOLEAN NOT NULL DEFAULT true,
  show_height BOOLEAN NOT NULL DEFAULT true,
  show_reach BOOLEAN NOT NULL DEFAULT true,
  show_wingspan BOOLEAN NOT NULL DEFAULT true,
  show_goals BOOLEAN NOT NULL DEFAULT true,
  show_evaluations BOOLEAN NOT NULL DEFAULT true,
  show_in_rankings BOOLEAN NOT NULL DEFAULT true,
  public_card_enabled BOOLEAN NOT NULL DEFAULT false,
  public_card_slug TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 3. AVALIAÇÕES (histórico completo, nunca sobrescrito)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY DEFAULT ('eval_' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  age INTEGER NOT NULL,
  weight REAL NOT NULL,
  height REAL NOT NULL,
  reach_standing REAL NOT NULL,
  reach_jumping REAL NOT NULL,
  wingspan REAL NOT NULL,
  seated_height REAL,
  attack_reach REAL,
  block_reach REAL,
  laterality TEXT,
  practice_time TEXT DEFAULT '',
  vertical_jump REAL NOT NULL,
  bmi REAL NOT NULL,
  position TEXT NOT NULL,
  serve_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  goals TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluation_date);

-- --------------------------------------------------------
-- 4. REDEFINIÇÃO DE SENHA (códigos de 6 dígitos, 30 min)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY DEFAULT ('pr_' || gen_random_uuid()::text),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);

-- --------------------------------------------------------
-- 5. METAS INDIVIDUAIS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY DEFAULT ('goal_' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  metric_type TEXT,
  current_value REAL,
  target_value REAL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  progress_pct REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- --------------------------------------------------------
-- 6. CONQUISTAS / MEDALHAS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY DEFAULT ('ach_' || gen_random_uuid()::text),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- --------------------------------------------------------
-- Row Level Security (RLS)
-- --------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado lê seus próprios dados
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "evaluations_select_own" ON evaluations FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "goals_select_own" ON goals FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "achievements_select_own" ON achievements FOR SELECT USING (auth.uid()::text = user_id);

-- Usuário autenticado insere/atualiza/deleta apenas seus próprios dados
CREATE POLICY "profiles_manage_own" ON profiles FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "evaluations_insert_own" ON evaluations FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "evaluations_manage_own" ON evaluations FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "goals_manage_own" ON goals FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "achievements_insert_own" ON achievements FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Leitura pública de perfis para a área TIME (somente campos autorizados)
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);

-- Leitura pública de avaliações para rankings/time (somente do próprio ou públicos)
CREATE POLICY "evaluations_public_read" ON evaluations FOR SELECT USING (true);

-- Leitura pública de metas e conquistas do próprio
CREATE POLICY "goals_public_read" ON goals FOR SELECT USING (true);
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);

-- Migrações idempotentes para instalações existentes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wingspan NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id TEXT;

-- --------------------------------------------------------
COMMENT ON TABLE users IS 'Contas de atletas (senhas nunca em texto claro).';
COMMENT ON TABLE profiles IS 'Dados pessoais e toggles de privacidade (LGPD).';
COMMENT ON TABLE evaluations IS 'Histórico completo de avaliações (nunca sobrescrito).';
COMMENT ON TABLE goals IS 'Metas individuais dos atletas.';
COMMENT ON TABLE achievements IS 'Conquistas/medalhas desbloqueadas automaticamente.';
COMMENT ON TABLE password_resets IS 'Códigos de redefinição de senha (6 dígitos, 30 min).';
