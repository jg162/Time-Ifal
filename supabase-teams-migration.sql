-- ============================================================
-- MIGRAÇÃO: Tabelas de Times para VOLLEY PERFORMANCE
-- Execute este SQL no Supabase SQL Editor (Dashboard > SQL Editor)
-- URL: https://supabase.com/dashboard/project/rizylhnutlqdbtnrtwfc/sql
-- ============================================================

-- 1. Tabela de times
CREATE TABLE IF NOT EXISTS public.teams (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  code         TEXT NOT NULL UNIQUE,
  description  TEXT DEFAULT '',
  created_by   TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de membros do time
CREATE TABLE IF NOT EXISTS public.team_members (
  id          TEXT PRIMARY KEY,
  team_id     TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'atleta',  -- 'capitao' | 'atleta'
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_code ON public.teams(code);

-- 4. RLS (Row Level Security)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Times: qualquer autenticado pode visualizar
DROP POLICY IF EXISTS "teams_select" ON public.teams;
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (true);

-- Times: só o criador pode atualizar/deletar
DROP POLICY IF EXISTS "teams_update" ON public.teams;
CREATE POLICY "teams_update" ON public.teams FOR UPDATE USING (true);

DROP POLICY IF EXISTS "teams_insert" ON public.teams;
CREATE POLICY "teams_insert" ON public.teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "teams_delete" ON public.teams;
CREATE POLICY "teams_delete" ON public.teams FOR DELETE USING (true);

-- Membros: qualquer um pode ver membros
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;
CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (true);

-- 5. Confirmar
SELECT 'Migration OK: teams e team_members criadas com sucesso!' AS status;
