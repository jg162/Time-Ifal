-- ====================================================================
-- PLATAFORMA DE AVALIAÇÃO DE ATLETAS DE VÔLEI - TIME IFAL
-- Schema PostgreSQL para Supabase com RLS (Row Level Security)
-- ====================================================================

-- 1. Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis dos Atletas (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  preferred_position TEXT NOT NULL DEFAULT 'Ponteiro',
  serve_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  bio_goals TEXT DEFAULT '',
  avatar_url TEXT,
  show_weight BOOLEAN NOT NULL DEFAULT TRUE,
  show_height BOOLEAN NOT NULL DEFAULT TRUE,
  show_reach BOOLEAN NOT NULL DEFAULT TRUE,
  show_wingspan BOOLEAN NOT NULL DEFAULT TRUE,
  show_goals BOOLEAN NOT NULL DEFAULT TRUE,
  show_evaluations BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Avaliações Físicas (Evaluations)
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  age INTEGER NOT NULL,
  weight NUMERIC(5,2) NOT NULL, -- em kg
  height NUMERIC(5,2) NOT NULL, -- em cm
  reach_standing NUMERIC(5,2) NOT NULL, -- alcance vertical parado (cm)
  reach_jumping NUMERIC(5,2) NOT NULL, -- alcance vertical pulando (cm)
  wingspan NUMERIC(5,2) NOT NULL, -- envergadura (cm)
  vertical_jump NUMERIC(5,2) NOT NULL, -- alcance pulando - parado (cm)
  bmi NUMERIC(4,1) NOT NULL, -- IMC: peso / (altura/100)^2
  position TEXT NOT NULL,
  serve_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  goals TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON public.evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON public.evaluations(evaluation_date DESC);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Profiles:
-- Todos os atletas autenticados podem ver perfis do time
CREATE POLICY "Atletas autenticados podem visualizar perfis do time"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Cada atleta só pode inserir/atualizar seu próprio perfil
CREATE POLICY "Atletas podem atualizar somente seu próprio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Atletas podem criar seu próprio perfil"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Políticas de RLS para Evaluations:
-- O próprio atleta pode ver todas as suas avaliações
CREATE POLICY "Atletas podem ver suas próprias avaliações"
  ON public.evaluations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = evaluations.user_id 
      AND profiles.show_evaluations = TRUE
    )
  );

CREATE POLICY "Atletas podem criar suas próprias avaliações"
  ON public.evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Atletas podem atualizar suas próprias avaliações"
  ON public.evaluations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Atletas podem excluir suas próprias avaliações"
  ON public.evaluations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Trigger automático para criar Perfil ao cadastrar novo usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, preferred_position, serve_types, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'Ponteiro',
    '["Flutuante pulando"]'::jsonb,
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
