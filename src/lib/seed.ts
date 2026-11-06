import { ensureSeedData as ensureSeedDataDb } from './db';
import { useSupabase } from './db';

/**
 * Limpa atletas de demonstração (seed) anteriores caso existam,
 * garantindo que a plataforma inicie limpa apenas com os atletas
 * reais cadastrados pelos usuários.
 */
async function cleanupSqliteMockAthletes() {
  try {
    const { getDatabase } = await import('./db-sqlite');
    const db = getDatabase();
    db.prepare("DELETE FROM evaluations WHERE user_id LIKE 'athlete-%' OR id LIKE 'eval-athlete-%'").run();
    db.prepare("DELETE FROM profiles WHERE user_id LIKE 'athlete-%'").run();
    db.prepare("DELETE FROM users WHERE user_id LIKE 'athlete-%'").run();
  } catch (err) {
    // Silencioso em caso de tabela ainda não inicializada
  }
}

export async function ensureSeedData() {
  if (useSupabase()) {
    return ensureSeedDataDb();
  }
  // No ambiente serverless (Vercel), não tenta carregar SQLite se Supabase não estiver configurado
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  await cleanupSqliteMockAthletes();
}
