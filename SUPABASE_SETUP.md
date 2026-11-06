# CONFIGURAÇÃO DO SUPABASE NO VERCEL (obrigatório para cadastro/login em produção)

O Vercel é serverless (sistema de arquivos somente leitura), então o **SQLite local não grava em produção**. É obrigatório configurar o **Supabase/PostgreSQL** para o cadastro, login e salvamento de avaliações funcionarem em https://time-ifal.vercel.app.

## Passo 1: Criar projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie um novo projeto.
2. Vá em **Settings → API** e copie:
   - **Project URL** → ex: `https://abcdefghijklmnop.supabase.co`
   - **anon public** → chave `eyJ...` (análoga)
   - **service_role** (chave secreta, não compartilhar) → `eyJ...`

## Passo 2: Criar as tabelas

No painel do Supabase, vá em **SQL Editor**, cole todo o conteúdo do arquivo `supabase-schema.sql` (repositório) e execute (▶ Run).

Isso cria as tabelas: `users`, `profiles`, `evaluations`, `goals`, `achievements`, `password_resets` com Row Level Security (RLS).

## Passo 3: Configurar variáveis no Vercel

No painel do Vercel: **time-ifal → Settings → Environment Variables** (ou `Production`), adicione:

| Variável | Exemplo de valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefghijklmnop.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` (service_role secreto) |
| `JWT_SECRET` | `qualquer_string_longa_aleatoria_de_32+_caracteres` |
| `NEXT_PUBLIC_APP_URL` | `https://time-ifal.vercel.app` |

Após salvar cada uma, o Vercel faz redeploy automático.

## Passo 4: Verificar

Acesse https://time-ifal.vercel.app/cadastro e crie uma conta. O cadastro deve funcionar e os dados serão gravados no Supabase.

## Desenvolvimento local (localhost)

Não precisa do Supabase. Rodando `npm run dev`, o sistema usa SQLite local em `data/volleyball.db` (arquivo ignorado no git).
