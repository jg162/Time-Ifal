/**
 * Camada de dados unificada da plataforma VOLLEY PERFORMANCE.
 *
 * Modo de operação:
 * - Se NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY estiverem
 *   configuradas (produção no Vercel), delega para src/lib/db-supabase.ts
 *   (PostgreSQL via Supabase, gravável em serverless).
 * - Caso contrário, importa dinamicamente src/lib/db-sqlite.ts (SQLite local, para
 *   desenvolvimento em localhost).
 *
 * Todas as funções são assíncronas. As rotas de API já usam `await` nas
 * chamadas a este módulo.
 */

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
  Team,
  TeamAthlete,
  TeamMember,
  User,
  RankingEntry,
  RankingCategory,
  AthleteCardData,
} from './types'

let sqliteModule: typeof import('./db-sqlite') | null = null

async function getSqlite() {
  if (!sqliteModule) {
    sqliteModule = await import('./db-sqlite')
  }
  return sqliteModule
}

function useSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(
    url &&
    key &&
    !url.includes('demo.supabase.co')
  )
}

export { useSupabase };

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  if (useSupabase()) return supabase.getUserByEmail(email)
  const sql = await getSqlite()
  return sql.getUserByEmail(email)
}

export async function getUserById(id: string): Promise<User | null> {
  if (useSupabase()) return supabase.getUserById(id)
  const sql = await getSqlite()
  return sql.getUserById(id)
}

export async function createUser(user: { id: string; email: string; password_hash: string; name: string; avatar_url?: string }): Promise<User> {
  if (useSupabase()) return supabase.createUser(user)
  const sql = await getSqlite()
  return sql.createUser(user)
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  if (useSupabase()) return supabase.updateUserPassword(userId, passwordHash)
  const sql = await getSqlite()
  return sql.updateUserPassword(userId, passwordHash)
}

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  if (useSupabase()) return supabase.getProfileByUserId(userId)
  const sql = await getSqlite()
  return sql.getProfileByUserId(userId)
}

export async function updateProfile(userId: string, data: Partial<Profile> & { name?: string; avatar_url?: string }): Promise<Profile> {
  if (useSupabase()) return supabase.updateProfile(userId, data)
  const sql = await getSqlite()
  return sql.updateProfile(userId, data)
}

// ---------------------------------------------------------------------------
// EVALUATIONS
// ---------------------------------------------------------------------------

export async function createEvaluation(evalData: Omit<Evaluation, 'created_at'>): Promise<Evaluation> {
  if (useSupabase()) return supabase.createEvaluation(evalData)
  const sql = await getSqlite()
  return sql.createEvaluation(evalData)
}

export async function getEvaluationsByUserId(userId: string): Promise<Evaluation[]> {
  if (useSupabase()) return supabase.getEvaluationsByUserId(userId)
  const sql = await getSqlite()
  return sql.getEvaluationsByUserId(userId)
}

export async function getEvaluationById(id: string, userId?: string): Promise<Evaluation | null> {
  if (useSupabase()) return supabase.getEvaluationById(id, userId)
  const sql = await getSqlite()
  return sql.getEvaluationById(id, userId)
}

export async function deleteEvaluation(id: string, userId: string): Promise<boolean> {
  if (useSupabase()) return supabase.deleteEvaluation(id, userId)
  const sql = await getSqlite()
  return sql.deleteEvaluation(id, userId)
}

// ---------------------------------------------------------------------------
// TEAMS & INVITES
// ---------------------------------------------------------------------------

export async function createTeam(name: string, description = '', createdByUserId?: string): Promise<Team> {
  if (useSupabase()) return supabase.createTeam(name, description, createdByUserId)
  const sql = await getSqlite()
  return sql.createTeam(name, description, createdByUserId)
}

export async function getTeamByCode(code: string): Promise<Team | null> {
  if (useSupabase()) return supabase.getTeamByCode(code)
  const sql = await getSqlite()
  return sql.getTeamByCode(code)
}

export async function getTeamById(id: string): Promise<Team | null> {
  if (useSupabase()) return supabase.getTeamById(id)
  const sql = await getSqlite()
  return sql.getTeamById(id)
}

export async function getUserTeam(userId: string): Promise<Team | null> {
  if (useSupabase()) return supabase.getUserTeam(userId)
  const sql = await getSqlite()
  return sql.getUserTeam(userId)
}

export async function addUserToTeam(userId: string, teamId: string, role = 'atleta'): Promise<void> {
  if (useSupabase()) return supabase.addUserToTeam(userId, teamId, role)
  const sql = await getSqlite()
  return sql.addUserToTeam(userId, teamId, role)
}

// ---------------------------------------------------------------------------
// TEAM ATHLETES
// ---------------------------------------------------------------------------

export async function getAllTeamAthletes(requestingUserId?: string, teamIdFilter?: string): Promise<TeamAthlete[]> {
  if (useSupabase()) return supabase.getAllTeamAthletes(requestingUserId, teamIdFilter)
  const sql = await getSqlite()
  return sql.getAllTeamAthletes(requestingUserId, teamIdFilter)
}

export async function getAthleteDetails(athleteId: string, requestingUserId?: string) {
  if (useSupabase()) return supabase.getAthleteDetails(athleteId, requestingUserId)
  const sql = await getSqlite()
  return sql.getAthleteDetails(athleteId, requestingUserId)
}

// ---------------------------------------------------------------------------
// RANKINGS
// ---------------------------------------------------------------------------

export async function getRanking(field: RankingCategory, limit = 100): Promise<RankingEntry[]> {
  if (useSupabase()) return supabase.getRanking(field, limit)
  const sql = await getSqlite()
  return sql.getRanking(field, limit)
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
  const sql = await getSqlite()
  return sql.createGoal(userId, input)
}

export async function getGoalById(goalId: string, userId: string): Promise<Goal | null> {
  if (useSupabase()) return supabase.getGoalById(goalId, userId)
  const sql = await getSqlite()
  return sql.getGoalById(goalId, userId)
}

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  if (useSupabase()) return supabase.getGoalsByUserId(userId)
  const sql = await getSqlite()
  return sql.getGoalsByUserId(userId)
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
  const sql = await getSqlite()
  return sql.updateGoal(goalId, userId, data)
}

export async function deleteGoal(goalId: string, userId: string): Promise<boolean> {
  if (useSupabase()) return supabase.deleteGoal(goalId, userId)
  const sql = await getSqlite()
  return sql.deleteGoal(goalId, userId)
}

export async function deleteUserAccount(userId: string): Promise<boolean> {
  if (useSupabase()) return supabase.deleteUserAccount(userId)
  const sql = await getSqlite()
  return sql.deleteUserAccount(userId)
}

export async function syncGoalsWithLatestEvaluation(userId: string): Promise<void> {
  if (useSupabase()) return supabase.syncGoalsWithLatestEvaluation(userId)
  const sql = await getSqlite()
  return sql.syncGoalsWithLatestEvaluation(userId)
}

// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------

export async function getAchievementsByUserId(userId: string): Promise<Achievement[]> {
  if (useSupabase()) return supabase.getAchievementsByUserId(userId)
  const sql = await getSqlite()
  return sql.getAchievementsByUserId(userId)
}

export async function unlockAchievements(userId: string, keys: AchievementKey[]): Promise<Achievement[]> {
  if (useSupabase()) return supabase.unlockAchievements(userId, keys)
  const sql = await getSqlite()
  return sql.unlockAchievements(userId, keys)
}

// ---------------------------------------------------------------------------
// PUBLIC CARD
// ---------------------------------------------------------------------------

export async function generateCardSlug(name: string): Promise<string> {
  if (useSupabase()) return supabase.generateCardSlugSupabase(name)
  const sql = await getSqlite()
  return sql.generateCardSlug(name)
}

export async function getPublicCardBySlug(slug: string): Promise<AthleteCardData | null> {
  if (useSupabase()) return supabase.getPublicCardBySlug(slug)
  const sql = await getSqlite()
  return sql.getPublicCardBySlug(slug)
}

// ---------------------------------------------------------------------------
// PASSWORD RESETS
// ---------------------------------------------------------------------------

export async function createPasswordResetToken(email: string, code: string): Promise<void> {
  if (useSupabase()) return supabase.createPasswordResetToken(email, code)
  const sql = await getSqlite()
  return sql.createPasswordResetToken(email, code)
}

export async function verifyAndUsePasswordReset(email: string, code: string, newPasswordHash: string): Promise<boolean> {
  if (useSupabase()) return supabase.verifyAndUsePasswordReset(email, code, newPasswordHash)
  const sql = await getSqlite()
  return sql.verifyAndUsePasswordReset(email, code, newPasswordHash)
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
  Team, TeamMember, TeamAthlete, Position, ServeType, Achievement, AchievementKey,
  RankingEntry, RankingCategory, AthleteCardData,
}
