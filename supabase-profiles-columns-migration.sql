-- ============================================================
-- MIGRAÇÃO: colunas faltantes na tabela profiles
-- Projeto: VOLLEY PERFORMANCE · TIME IFAL
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================
-- Contexto: o código salva avatar_url, height, weight e wingspan
-- diretamente na tabela profiles, mas a instalação de produção
-- não possui essas colunas. Sem elas, cada salvamento de perfil
-- gera 4 tentativas com erro (contornadas pela tag [ATHLETE_META]
-- na bio), e a coluna de team_id legada também é adicionada abaixo
-- para compatibilidade com instalações antigas.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wingspan NUMERIC;

-- Coluna legada mantida para compatibilidade (o app atual usa
-- team_members/bio tag, mas instalações antigas podem ter dados nela)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id TEXT;

-- Confirmar
SELECT 'Migração OK: colunas avatar_url, height, weight, wingspan, team_id garantidas em profiles!' AS status;
