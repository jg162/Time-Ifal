-- ============================================================
-- AUDITORIA TRUSTMODE — SEGURANÇA E ROW LEVEL SECURITY (RLS)
-- Projeto: VOLLEY PERFORMANCE · TIME IFAL
-- ============================================================

-- 1. Habilitar RLS em todas as tabelas públicas
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'users'
-- Leitura pública de dados não-sensíveis (id, name, avatar_url)
DROP POLICY IF EXISTS "users_select_public" ON public.users;
CREATE POLICY "users_select_public" ON public.users 
  FOR SELECT 
  USING (true);

-- Edição apenas do próprio usuário
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users 
  FOR UPDATE 
  USING (auth.uid()::text = id OR current_setting('request.jwt.claim.sub', true) = id);

-- 3. Políticas para 'profiles'
-- Leitura permitida para elenco do time
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles 
  FOR SELECT 
  USING (true);

-- Inserção e atualização: apenas o próprio dono do perfil
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

-- 4. Políticas para 'evaluations'
-- Leitura: permitida para comparações e time
DROP POLICY IF EXISTS "evaluations_select" ON public.evaluations;
CREATE POLICY "evaluations_select" ON public.evaluations 
  FOR SELECT 
  USING (true);

-- Criar avaliação: apenas para o próprio atleta
DROP POLICY IF EXISTS "evaluations_insert_own" ON public.evaluations;
CREATE POLICY "evaluations_insert_own" ON public.evaluations 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

-- Atualizar e Deletar: apenas o próprio atleta
DROP POLICY IF EXISTS "evaluations_update_own" ON public.evaluations;
CREATE POLICY "evaluations_update_own" ON public.evaluations 
  FOR UPDATE 
  USING (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

DROP POLICY IF EXISTS "evaluations_delete_own" ON public.evaluations;
CREATE POLICY "evaluations_delete_own" ON public.evaluations 
  FOR DELETE 
  USING (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

-- 5. Políticas para 'goals' (Metas)
-- Metas são restritas ao próprio atleta
DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
CREATE POLICY "goals_select_own" ON public.goals 
  FOR SELECT 
  USING (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
CREATE POLICY "goals_insert_own" ON public.goals 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
CREATE POLICY "goals_update_own" ON public.goals 
  FOR UPDATE 
  USING (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
CREATE POLICY "goals_delete_own" ON public.goals 
  FOR DELETE 
  USING (auth.uid()::text = user_id OR current_setting('request.jwt.claim.sub', true) = user_id);

-- 6. Políticas para 'achievements'
DROP POLICY IF EXISTS "achievements_select" ON public.achievements;
CREATE POLICY "achievements_select" ON public.achievements 
  FOR SELECT 
  USING (true);

-- 7. Service Role Bypass
-- A service role key (usada pela API do Next.js via SUPABASE_SERVICE_ROLE_KEY)
-- já possui permissão de bypass para aplicar as regras de negócio validadas
-- no código TypeScript da aplicação.
