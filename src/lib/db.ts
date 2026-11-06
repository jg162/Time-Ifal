/**
 * Camada de dados unificada da plataforma VOLLEY PERFORMANCE.
 *
 * Modo de operação:
 * - Se NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY estiverem
 *   configuradas (produção no Vercel), delega para src/lib/db-supabase.ts
 *   (PostgreSQL via Supabase, gravável em serverless).
 * - Caso contrário, usa src/lib/db-sqlite.ts (SQLite local, para
 *   desenvolvimento em localhost).
 *
 * Todas as funções são assíncronas. As rotas de API já usam `await` nas
 * chamadas a este módulo.
 */

import * as sqlite from './db-sqlite'
import * as supabase from './db-supabase'
import {
  Achievement,
  AchievementKey,
  Evaluation,
  Goal,
  GoalMetricType,
  GoalStatus,
  Position,
  Profile,
  ServeType,
  TeamAthlete,
  User,
  RankingEntry,
  RankingCategory,
  AthleteCardData,
} from './types'

function useSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo.supabase.co')
  )
}

export { useSupabase };

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  if (useSupabase()) return supabase.getUserByEmail(email)
  return Promise.resolve(sqlite.getUserByEmail(email))
}

export async function getUserById(id: string): Promise<User | null> {
  if (useSupabase()) return supabase.getUserById(id)
  return Promise.resolve(sqlite.getUserById(id))
}

export async function createUser(user: { id: string; email: string; password_hash: string; name: string; avatar_url?: string }): Promise<User> {
  if (useSupabase()) return supabase.createUser(user)
  return Promise.resolve(sqlite.createUser(user))
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  if (useSupabase()) return supabase.updateUserPassword(userId, passwordHash)
  return Promise.resolve(sqlite.updateUserPassword(userId, passwordHash))
}

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  if (useSupabase()) return supabase.getProfileByUserId(userId)
  return Promise.resolve(sqlite.getProfileByUserId(userId))
}

export async function updateProfile(userId: string, data: Partial<Profile> & { name?: string; avatar_url?: string }): Promise<Profile> {
  if (useSupabase()) return supabase.updateProfile(userId, data)
  return Promise.resolve(sqlite.updateProfile(userId, data))
}

// ---------------------------------------------------------------------------
// EVALUATIONS
// ---------------------------------------------------------------------------

export async function createEvaluation(evalData: Omit<Evaluation, 'created_at'>): Promise<Evaluation> {
  if (useSupabase()) return supabase.createEvaluation(evalData)
  return Promise.resolve(sqlite.createEvaluation(evalData))
}

export async function getEvaluationsByUserId(userId: string): Promise<Evaluation[]> {
  if (useSupabase()) return supabase.getEvaluationsByUserId(userId)
  return Promise.resolve(sqlite.getEvaluationsByUserId(userId))
}

export async function getEvaluationById(id: string, userId?: string): Promise<Evaluation | null> {
  if (useSupabase()) return supabase.getEvaluationById(id, userId)
  return Promise.resolve(sqlite.getEvaluationById(id, userId))
}

export async function deleteEvaluation(id: string, userId: string): Promise<boolean> {
  if (useSupabase()) return supabase.deleteEvaluation(id, userId)
  return Promise.resolve(sqlite.deleteEvaluation(id, userId))
}

// ---------------------------------------------------------------------------
// TEAM
// ---------------------------------------------------------------------------

export async function getAllTeamAthletes(requestingUserId?: string): Promise<TeamAthlete[]> {
  if (useSupabase()) return supabase.getAllTeamAthletes(requestingUserId)
  return Promise.resolve(sqlite.getAllTeamAthletes(requestingUserId))
}

export async function getAthleteDetails(athleteId: string, requestingUserId?: string) {
  if (useSupabase()) return supabase.getAthleteDetails(athleteId, requestingUserId)
  return Promise.resolve(sqlite.getAthleteDetails(athleteId, requestingUserId))
}

// ---------------------------------------------------------------------------
// RANKINGS
// ---------------------------------------------------------------------------

export async function getRanking(field: RankingCategory, limit = 100): Promise<RankingEntry[]> {
  if (useSupabase()) return supabase.getRanking(field, limit)
  return Promise.resolve(sqlite.getRanking(field, limit))
}

// ---------------------------------------------------------------------------
// GOALS
// ---------------------------------------------------------------------------

export async function createGoal(userId: string, input: {
  title: string
  description?: string
  metric_type?: GoalMetricType | null
  current_value?: number | null
  target_value?: number | null
  deadline?: string | null
}): Promise<Goal> {
  if (useSupabase()) return supabase.createGoal(userId, input)
  return Promise.resolve(sqlite.createGoal(userId, input))
}

export async function getGoalById(goalId: string, userId: string): Promise<Goal | null> {
  if (useSupabase()) return supabase.getGoalById(goalId, userId)
  return Promise.resolve(sqlite.getGoalById(goalId, userId))
}

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  if (useSupabase()) return supabase.getGoalsByUserId(userId)
  return Promise.resolve(sqlite.getGoalsByUserId(userId))
}

export async function updateGoal(goalId: string, userId: string, data: Partial<{
  title: string
  description: string
  metric_type: GoalMetricType | null
  current_value: number | null
  target_value: number | null
  deadline: string | null
  status: GoalStatus
  progress_pct: number
}>): Promise<Goal | null> {
  if (useSupabase()) return supabase.updateGoal(goalId, userId, data)
  return Promise.resolve(sqlite.updateGoal(goalId, userId, data))
}

export async function deleteGoal(goalId: string, userId: string): Promise<boolean> {
  if (useSupabase()) return supabase.deleteGoal(goalId, userId)
  return Promise.resolve(sqlite.deleteGoal(goalId, userId))
}

export async function syncGoalsWithLatestEvaluation(userId: string): Promise<void> {
  if (useSupabase()) return supabase.syncGoalsWithLatestEvaluation(userId)
  return Promise.resolve(sqlite.syncGoalsWithLatestEvaluation(userId))
}

// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------

export async function getAchievementsByUserId(userId: string): Promise<Achievement[]> {
  if (useSupabase()) return supabase.getAchievementsByUserId(userId)
  return Promise.resolve(sqlite.getAchievementsByUserId(userId))
}

export async function unlockAchievements(userId: string, keys: AchievementKey[]): Promise<Achievement[]> {
  if (useSupabase()) return supabase.unlockAchievements(userId, keys)
  return Promise.resolve(sqlite.unlockAchievements(userId, keys))
}

// ---------------------------------------------------------------------------
// PUBLIC CARD
// ---------------------------------------------------------------------------

export async function generateCardSlug(name: string): Promise<string> {
  if (useSupabase()) return supabase.generateCardSlugSupabase(name)
  return Promise.resolve(sqlite.generateCardSlug(name))
}

export async function getPublicCardBySlug(slug: string): Promise<AthleteCardData | null> {
  if (useSupabase()) return supabase.getPublicCardBySlug(slug)
  return Promise.resolve(sqlite.getPublicCardBySlug(slug))
}

// ---------------------------------------------------------------------------
// PASSWORD RESETS
// ---------------------------------------------------------------------------

export async function createPasswordResetToken(email: string, code: string): Promise<void> {
  if (useSupabase()) return supabase.createPasswordResetToken(email, code)
  return Promise.resolve(sqlite.createPasswordResetToken(email, code))
}

export async function verifyAndUsePasswordReset(email: string, code: string, newPasswordHash: string): Promise<boolean> {
  if (useSupabase()) return supabase.verifyAndUsePasswordReset(email, code, newPasswordHash)
  return Promise.resolve(sqlite.verifyAndUsePasswordReset(email, code, newPasswordHash))
}

// ---------------------------------------------------------------------------
// SEED (delegado para seed.ts, que lida com ambos os modos)
// ---------------------------------------------------------------------------

export async function ensureSeedData(): Promise<void> {
  // No modo Supabase, roda o seed próprio do módulo supabase.
  // No modo SQLite, o seed.ts já cuida da inicialização local.
  if (useSupabase()) return supabase.ensureSeedDataSupabase()
  return Promise.resolve()
}

// Re-exporta tipos para compatibilidade com os módulos existentes
export type {
  User, Profile, Evaluation, Goal, GoalStatus, GoalMetricType,
  TeamAthlete, Position, ServeType, Achievement, AchievementKey,
  RankingEntry, RankingCategory, AthleteCardData,
}
