/**
 * Camada de dados PostgreSQL/Supabase para a plataforma VOLLEY PERFORMANCE.
 *
 * Todas as funções espelham a API de src/lib/db.ts (SQLite) para que as rotas
 * de API e páginas funcionem sem alterações. Quando as env vars do Supabase
 * estiverem configuradas (produção no Vercel), este módulo é usado; caso
 * contrário, o módulo db.ts mantém o SQLite local para desenvolvimento.
 *
 * As operações usam a SERVICE_ROLE_KEY para bypassar o RLS do Supabase, já que
 * a validação de propriedade (user_id) é feita explicitamente no código da
 * aplicação, igual ao comportamento do SQLite.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
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
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Cliente Supabase (service role - bypass de RLS, validação na aplicação)
// ---------------------------------------------------------------------------

let supabaseInstance: SupabaseClient | null = null

function generateId(prefix: string): string {
  return prefix + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function getSupabase(): SupabaseClient | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!rawUrl || !serviceKey || rawUrl.includes('demo.supabase.co')) return null
  const url = rawUrl.replace(/\/+$/, '')
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return supabaseInstance
}

function isSupabase(): boolean {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(rawUrl && serviceKey && !rawUrl.includes('demo.supabase.co'))
}

// ---------------------------------------------------------------------------
// Helpers de tipo
// ---------------------------------------------------------------------------

function toProfile(row: any): Profile {
  return {
    user_id: row.user_id,
    full_name: row.full_name,
    birth_date: row.birth_date ?? null,
    preferred_position: (row.preferred_position || 'Ponteiro') as Position,
    laterality: row.laterality ?? null,
    practice_time: row.practice_time ?? '',
    serve_types: Array.isArray(row.serve_types) ? row.serve_types : JSON.parse(row.serve_types || '[]'),
    bio_goals: row.bio_goals ?? null,
    show_weight: Boolean(row.show_weight),
    show_height: Boolean(row.show_height),
    show_reach: Boolean(row.show_reach),
    show_wingspan: Boolean(row.show_wingspan),
    show_goals: Boolean(row.show_goals),
    show_evaluations: Boolean(row.show_evaluations),
    show_in_rankings: row.show_in_rankings === undefined ? true : Boolean(row.show_in_rankings),
    public_card_enabled: Boolean(row.public_card_enabled),
    public_card_slug: row.public_card_slug ?? null,
    updated_at: row.updated_at,
  }
}

function toEvaluation(row: any): Evaluation {
  return {
    id: row.id,
    user_id: row.user_id,
    evaluation_date: row.evaluation_date,
    full_name: row.full_name,
    birth_date: row.birth_date,
    age: row.age,
    weight: row.weight,
    height: row.height,
    reach_standing: row.reach_standing,
    reach_jumping: row.reach_jumping,
    wingspan: row.wingspan,
    seated_height: row.seated_height ?? null,
    attack_reach: row.attack_reach ?? null,
    block_reach: row.block_reach ?? null,
    laterality: row.laterality ?? null,
    practice_time: row.practice_time ?? '',
    vertical_jump: row.vertical_jump,
    bmi: row.bmi,
    position: row.position as Position,
    serve_types: Array.isArray(row.serve_types) ? row.serve_types : JSON.parse(row.serve_types || '[]'),
    goals: row.goals,
    notes: row.notes,
    created_at: row.created_at,
  }
}

function toGoal(row: any): Goal {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? '',
    metric_type: row.metric_type,
    current_value: row.current_value,
    target_value: row.target_value,
    deadline: row.deadline,
    status: row.status as GoalStatus,
    progress_pct: row.progress_pct,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  if (!isSupabase()) return null // SQLite lida com isso em db.ts
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('users').select('*').eq('email', email).maybeSingle()
  if (error || !data) return null
  return { ...data } as User & { password_hash: string }
}

export async function getUserById(id: string): Promise<User | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('users').select('id, email, name, avatar_url, created_at').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as User
}

export async function createUser(user: { id: string; email: string; password_hash: string; name: string; avatar_url?: string }): Promise<User> {
  if (!isSupabase()) throw new Error('createUser via Supabase não disponível localmente')
  const sb = getSupabase()!
  const now = new Date().toISOString()
  const slug = generateCardSlugSupabase(user.name)

  const { error } = await sb.from('users').insert({
    id: user.id,
    email: user.email.toLowerCase(),
    password_hash: user.password_hash,
    name: user.name,
    avatar_url: user.avatar_url || null,
    created_at: now,
  })
  if (error) throw error

  await sb.from('profiles').insert({
    user_id: user.id,
    full_name: user.name,
    birth_date: null,
    preferred_position: 'Ponteiro',
    serve_types: ['Flutuante pulando'],
    bio_goals: '',
    practice_time: '',
    show_weight: true,
    show_height: true,
    show_reach: true,
    show_wingspan: true,
    show_goals: true,
    show_evaluations: true,
    show_in_rankings: true,
    public_card_enabled: false,
    public_card_slug: slug,
    updated_at: now,
  })

  return { id: user.id, email: user.email.toLowerCase(), name: user.name, avatar_url: user.avatar_url || null, created_at: now }
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  if (!isSupabase()) return
  const sb = getSupabase()!
  const { error } = await sb.from('users').update({ password_hash: passwordHash }).eq('id', userId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!
  const { data, error } = await sb.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  return toProfile(data)
}

export async function updateProfile(userId: string, data: Partial<Profile> & { name?: string; avatar_url?: string }): Promise<Profile> {
  if (!isSupabase()) throw new Error('updateProfile via Supabase não disponível localmente')
  const sb = getSupabase()!
  const now = new Date().toISOString()
  const current = await getProfileByUserId(userId)
  if (!current) throw new Error('Profile not found')

  const updates: any = {
    full_name: data.full_name ?? (data.name ?? current.full_name),
    birth_date: data.birth_date !== undefined ? data.birth_date : current.birth_date,
    preferred_position: data.preferred_position ?? current.preferred_position,
    laterality: data.laterality !== undefined ? data.laterality : current.laterality,
    practice_time: data.practice_time !== undefined ? data.practice_time : current.practice_time,
    serve_types: data.serve_types ? data.serve_types : current.serve_types,
    bio_goals: data.bio_goals !== undefined ? data.bio_goals : current.bio_goals,
    show_weight: data.show_weight !== undefined ? data.show_weight : current.show_weight,
    show_height: data.show_height !== undefined ? data.show_height : current.show_height,
    show_reach: data.show_reach !== undefined ? data.show_reach : current.show_reach,
    show_wingspan: data.show_wingspan !== undefined ? data.show_wingspan : current.show_wingspan,
    show_goals: data.show_goals !== undefined ? data.show_goals : current.show_goals,
    show_evaluations: data.show_evaluations !== undefined ? data.show_evaluations : current.show_evaluations,
    show_in_rankings: data.show_in_rankings !== undefined ? data.show_in_rankings : current.show_in_rankings,
    public_card_enabled: data.public_card_enabled !== undefined ? data.public_card_enabled : current.public_card_enabled,
    public_card_slug: data.public_card_slug !== undefined ? data.public_card_slug : (current.public_card_slug || generateCardSlugSupabase(current.full_name)),
    updated_at: now,
  }

  if (data.name !== undefined || data.avatar_url !== undefined) {
    await sb.from('users').update({
      name: data.name ?? null,
      avatar_url: data.avatar_url ?? null,
    }).eq('id', userId)
  }

  const { error } = await sb.from('profiles').update(updates).eq('user_id', userId)
  if (error) throw error

  const updated = await getProfileByUserId(userId)
  if (!updated) throw new Error('Profile not found after update')
  return updated
}

// ---------------------------------------------------------------------------
// EVALUATIONS
// ---------------------------------------------------------------------------

export async function createEvaluation(evalData: Omit<Evaluation, 'created_at'>): Promise<Evaluation> {
  if (!isSupabase()) throw new Error('createEvaluation via Supabase não disponível localmente')
  const sb = getSupabase()!
  const now = new Date().toISOString()

  const { data, error } = await sb.from('evaluations').insert({
    id: evalData.id,
    user_id: evalData.user_id,
    evaluation_date: evalData.evaluation_date,
    full_name: evalData.full_name,
    birth_date: evalData.birth_date,
    age: evalData.age,
    weight: evalData.weight,
    height: evalData.height,
    reach_standing: evalData.reach_standing,
    reach_jumping: evalData.reach_jumping,
    wingspan: evalData.wingspan,
    seated_height: evalData.seated_height,
    attack_reach: evalData.attack_reach,
    block_reach: evalData.block_reach,
    laterality: evalData.laterality,
    practice_time: evalData.practice_time || '',
    vertical_jump: evalData.vertical_jump,
    bmi: evalData.bmi,
    position: evalData.position,
    serve_types: evalData.serve_types,
    goals: evalData.goals,
    notes: evalData.notes || '',
    created_at: now,
  }).select().single()

  if (error || !data) throw error ?? new Error('Falha ao criar avaliação')

  // Sync profile metadata
  try {
    await sb.from('profiles').update({
      full_name: evalData.full_name,
      birth_date: evalData.birth_date,
      preferred_position: evalData.position,
      laterality: evalData.laterality,
      practice_time: evalData.practice_time || '',
      serve_types: evalData.serve_types,
      bio_goals: evalData.goals,
      updated_at: now,
    }).eq('user_id', evalData.user_id)
  } catch (err) {
    console.error('Failed to sync profile on evaluation:', err)
  }

  return { ...toEvaluation(data), created_at: now }
}

export async function getEvaluationsByUserId(userId: string): Promise<Evaluation[]> {
  if (!isSupabase()) return []
  const sb = getSupabase()!
  const { data, error } = await sb.from('evaluations')
    .select('*')
    .eq('user_id', userId)
    .order('evaluation_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map(toEvaluation)
}

export async function getEvaluationById(id: string, userId?: string): Promise<Evaluation | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!
  let q = sb.from('evaluations').select('*').eq('id', id)
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q.maybeSingle()
  if (error || !data) return null
  return toEvaluation(data)
}

export async function deleteEvaluation(id: string, userId: string): Promise<boolean> {
  if (!isSupabase()) return false
  const sb = getSupabase()!
  const { error } = await sb.from('evaluations').delete().eq('id', id).eq('user_id', userId)
  return !error
}

// ---------------------------------------------------------------------------
// TEAM
// ---------------------------------------------------------------------------

export async function getAllTeamAthletes(requestingUserId?: string): Promise<TeamAthlete[]> {
  if (!isSupabase()) return []
  const sb = getSupabase()!

  const { data: users, error: uErr } = await sb.from('users').select('id, name, avatar_url')
  if (uErr || !users) return []

  const { data: profiles, error: pErr } = await sb.from('profiles').select('*')
  if (pErr) return []

  const profileByUser = new Map(profiles.map(p => [p.user_id, p] as const))

  const result: TeamAthlete[] = []
  for (const u of users) {
    const p = profileByUser.get(u.id)
    const isSelf = requestingUserId === u.id
    const showWeight = isSelf || Boolean(p?.show_weight)
    const showHeight = isSelf || Boolean(p?.show_height)
    const showReach = isSelf || Boolean(p?.show_reach)
    const showWingspan = isSelf || Boolean(p?.show_wingspan)
    const showGoals = isSelf || Boolean(p?.show_goals)
    const showEvaluations = isSelf || Boolean(p?.show_evaluations)

    // Latest evaluation
    const { data: latestEval } = await sb.from('evaluations')
      .select('*')
      .eq('user_id', u.id)
      .order('evaluation_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const evalCountRes = await sb.from('evaluations').select('id', { count: 'exact', head: true }).eq('user_id', u.id)
    const evalCount = evalCountRes.count ?? 0

    let serveTypes: ServeType[] = []
    try {
      serveTypes = latestEval ? (Array.isArray(latestEval.serve_types) ? latestEval.serve_types : JSON.parse(latestEval.serve_types || '[]')) : (p?.serve_types ? (Array.isArray(p.serve_types) ? p.serve_types : JSON.parse(p.serve_types || '[]')) : [])
    } catch { serveTypes = [] }

    result.push({
      id: u.id,
      name: p?.full_name || u.name,
      avatar_url: u.avatar_url ?? null,
      position: (latestEval?.position || p?.preferred_position || 'Ponteiro') as Position,
      laterality: latestEval?.laterality || p?.laterality || null,
      birth_date: p?.birth_date ?? latestEval?.birth_date ?? null,
      age: latestEval?.age ?? null,
      height: showHeight ? (latestEval?.height ?? null) : null,
      weight: showWeight ? (latestEval?.weight ?? null) : null,
      reach_standing: showReach ? (latestEval?.reach_standing ?? null) : null,
      reach_jumping: showReach ? (latestEval?.reach_jumping ?? null) : null,
      wingspan: showWingspan ? (latestEval?.wingspan ?? null) : null,
      vertical_jump: showReach ? (latestEval?.vertical_jump ?? null) : null,
      attack_reach: showReach ? (latestEval?.attack_reach ?? null) : null,
      block_reach: showReach ? (latestEval?.block_reach ?? null) : null,
      bmi: (showWeight && showHeight) ? (latestEval?.bmi ?? null) : null,
      serve_types: serveTypes,
      practice_time: p?.practice_time || latestEval?.practice_time || null,
      goals: showGoals ? (latestEval?.goals || p?.bio_goals || null) : null,
      last_updated: latestEval?.evaluation_date || p?.updated_at || null,
      evaluations_count: showEvaluations ? evalCount : 0,
      is_self: isSelf,
      privacy: {
        show_weight: Boolean(p?.show_weight),
        show_height: Boolean(p?.show_height),
        show_reach: Boolean(p?.show_reach),
        show_wingspan: Boolean(p?.show_wingspan),
        show_goals: Boolean(p?.show_goals),
        show_evaluations: Boolean(p?.show_evaluations),
      },
    })
  }
  return result
}

export async function getAthleteDetails(athleteId: string, requestingUserId?: string) {
  const athletes = await getAllTeamAthletes(requestingUserId)
  const athlete = athletes.find(a => a.id === athleteId)
  if (!athlete) return null

  const isSelf = requestingUserId === athleteId
  const showEvaluations = isSelf || athlete.privacy.show_evaluations

  let evaluations: Evaluation[] = []
  if (showEvaluations) {
    const allEvals = await getEvaluationsByUserId(athleteId)
    evaluations = allEvals.map(ev => ({
      ...ev,
      weight: (isSelf || athlete.privacy.show_weight) ? ev.weight : 0,
      height: (isSelf || athlete.privacy.show_height) ? ev.height : 0,
      reach_standing: (isSelf || athlete.privacy.show_reach) ? ev.reach_standing : 0,
      reach_jumping: (isSelf || athlete.privacy.show_reach) ? ev.reach_jumping : 0,
      vertical_jump: (isSelf || athlete.privacy.show_reach) ? ev.vertical_jump : 0,
      attack_reach: (isSelf || athlete.privacy.show_reach) ? ev.attack_reach : null,
      block_reach: (isSelf || athlete.privacy.show_reach) ? ev.block_reach : null,
      wingspan: (isSelf || athlete.privacy.show_wingspan) ? ev.wingspan : 0,
      bmi: (isSelf || (athlete.privacy.show_weight && athlete.privacy.show_height)) ? ev.bmi : 0,
      goals: (isSelf || athlete.privacy.show_goals) ? ev.goals : 'Informação restrita pelo atleta.',
    }))
  }
  return { athlete, evaluations }
}

// ---------------------------------------------------------------------------
// RANKINGS
// ---------------------------------------------------------------------------

export async function getRanking(field: RankingCategory, limit = 100): Promise<RankingEntry[]> {
  if (!isSupabase()) return []
  const sb = getSupabase()!

  const { data, error } = await sb.from('evaluations')
    .select('*, users(name, avatar_url)')
    .not(field, 'is', null)
    .in('user_id', (() => {
      // subquery via separate call: profiles with show_in_rankings
      return []
    })()) as any
  if (error || !data) return []

  // Buscar perfis com show_in_rankings
  const { data: rankingProfiles } = await sb.from('profiles').select('user_id').eq('show_in_rankings', true)
  const rankingUserIds = new Set((rankingProfiles ?? []).map(p => p.user_id))

  // Para cada user, pegar a avaliação mais recente com o campo preenchido
  const byUser = new Map<string, any>()
  for (const r of data) {
    if (!rankingUserIds.has(r.user_id)) continue
    const val = field === 'vertical_jump' ? r.vertical_jump : r[field]
    if (!val || val <= 0) continue
    if (!byUser.has(r.user_id) || r.evaluation_date > byUser.get(r.user_id).evaluation_date) {
      byUser.set(r.user_id, r)
    }
  }

  const ordered = Array.from(byUser.values())
    .map(r => ({
      athlete_id: r.user_id,
      name: r.full_name,
      avatar_url: (r.users as any)?.avatar_url ?? null,
      position: r.position,
      value: field === 'vertical_jump' ? r.vertical_jump : r[field],
      evaluation_date: r.evaluation_date,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)

  return ordered.map((r, i) => ({ ...r, rank: i + 1 }))
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
  if (!isSupabase()) throw new Error('createGoal via Supabase não disponível localmente')
  const sb = getSupabase()!
  const now = new Date().toISOString()
  const id = generateId('goal_')

  const { data, error } = await sb.from('goals').insert({
    id, user_id: userId, title: input.title.trim(),
    description: input.description?.trim() || '',
    metric_type: input.metric_type ?? null,
    current_value: input.current_value ?? null,
    target_value: input.target_value ?? null,
    deadline: input.deadline ?? null,
    status: 'ativo',
    progress_pct: computeProgressPctSupabase(input.metric_type ?? null, input.current_value ?? null, input.target_value ?? null),
    created_at: now,
    updated_at: now,
  }).select().single()
  if (error || !data) throw error ?? new Error('Falha ao criar meta')
  return toGoal(data)
}

export async function getGoalById(goalId: string, userId: string): Promise<Goal | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!
  const { data, error } = await sb.from('goals').select('*').eq('id', goalId).eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  return toGoal(data)
}

export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  if (!isSupabase()) return []
  const sb = getSupabase()!
  const { data, error } = await sb.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(toGoal)
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
  if (!isSupabase()) return null
  const sb = getSupabase()!
  const now = new Date().toISOString()
  const existing = await getGoalById(goalId, userId)
  if (!existing) return null

  const metricType = data.metric_type !== undefined ? data.metric_type : existing.metric_type
  const currentValue = data.current_value !== undefined ? data.current_value : existing.current_value
  const targetValue = data.target_value !== undefined ? data.target_value : existing.target_value
  const status = data.status ?? existing.status

  const progress = status === 'concluido' ? 100 :
    (data.progress_pct !== undefined && metricType === 'tecnica'
      ? Math.max(0, Math.min(100, Math.round(data.progress_pct)))
      : computeProgressPctSupabase(metricType, currentValue, targetValue))

  const { error } = await sb.from('goals').update({
    title: data.title !== undefined ? data.title.trim() : existing.title,
    description: data.description !== undefined ? data.description.trim() : existing.description,
    metric_type: metricType,
    current_value: currentValue,
    target_value: targetValue,
    deadline: data.deadline !== undefined ? data.deadline : existing.deadline,
    status,
    progress_pct: progress,
    updated_at: now,
  }).eq('id', goalId).eq('user_id', userId)
  if (error) return null
  return getGoalById(goalId, userId)
}

export async function deleteGoal(goalId: string, userId: string): Promise<boolean> {
  if (!isSupabase()) return false
  const sb = getSupabase()!
  const { error } = await sb.from('goals').delete().eq('id', goalId).eq('user_id', userId)
  return !error
}

export async function syncGoalsWithLatestEvaluation(userId: string): Promise<void> {
  if (!isSupabase()) return
  const sb = getSupabase()!
  const { data: latest } = await sb.from('evaluations').select('*').eq('user_id', userId).order('evaluation_date', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!latest) return

  const metricMap: Record<string, number | null> = {
    attack_reach: latest.attack_reach,
    block_reach: latest.block_reach,
    vertical_jump: latest.vertical_jump,
    reach_jumping: latest.reach_jumping,
    wingspan: latest.wingspan,
    height: latest.height,
    weight: latest.weight,
  }

  const { data: goals } = await sb.from('goals').select('*').eq('user_id', userId).eq('status', 'ativo').not('metric_type', 'is', null).neq('metric_type', 'tecnica')
  if (!goals) return

  const now = new Date().toISOString()
  for (const g of goals) {
    const metricValue = metricMap[g.metric_type]
    if (metricValue === null || metricValue === undefined) continue
    const progress = computeProgressPctSupabase(g.metric_type, metricValue, g.target_value)
    await sb.from('goals').update({ current_value: metricValue, progress_pct: progress, updated_at: now }).eq('id', g.id)
  }
}

// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------

export async function getAchievementsByUserId(userId: string): Promise<Achievement[]> {
  if (!isSupabase()) return []
  const sb = getSupabase()!
  const { data, error } = await sb.from('achievements').select('achievement_key, unlocked_at').eq('user_id', userId)
  if (error || !data) return []
  return data.map(r => ({ key: r.achievement_key as AchievementKey, unlocked_at: r.unlocked_at }))
}

export async function unlockAchievements(userId: string, keys: AchievementKey[]): Promise<Achievement[]> {
  if (keys.length === 0) return []
  if (!isSupabase()) return []
  const sb = getSupabase()!
  const now = new Date().toISOString()
  const rows = keys.map(k => ({ id: generateId('ach_'), user_id: userId, achievement_key: k, unlocked_at: now }))
  const { error } = await sb.from('achievements').insert(rows)
  if (error) return []
  const { data } = await sb.from('achievements').select('achievement_key, unlocked_at').eq('user_id', userId).in('achievement_key', keys)
  return (data ?? []).map(r => ({ key: r.achievement_key as AchievementKey, unlocked_at: r.unlocked_at }))
}

// ---------------------------------------------------------------------------
// PUBLIC CARD (CARTEIRINHA)
// ---------------------------------------------------------------------------

export async function generateCardSlugSupabase(name: string): Promise<string> {
  const base = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'atleta'
  const sb = getSupabase()!
  let slug = base
  let attempt = 0
  while (true) {
    const { data } = await sb.from('profiles').select('user_id').eq('public_card_slug', slug).maybeSingle()
    if (!data) break
    attempt += 1
    if (attempt > 20) { slug = `${base}-${Math.random().toString(36).slice(2, 7)}`; break }
    slug = `${base}-${attempt}`
  }
  return slug
}

export async function getPublicCardBySlug(slug: string): Promise<AthleteCardData | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!
  const { data: profileRow } = await sb.from('profiles').select('*, users(name, avatar_url)').eq('public_card_slug', slug).eq('public_card_enabled', true).maybeSingle()
  if (!profileRow) return null

  const userId = profileRow.user_id
  const { data: latest } = await sb.from('evaluations').select('*').eq('user_id', userId).order('evaluation_date', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle()

  const birthDate = profileRow.birth_date || latest?.birth_date || null
  const age = birthDate ? computeAgeSupabase(birthDate, latest?.evaluation_date ?? undefined) : null

  const { data: achData } = await sb.from('achievements').select('achievement_key, unlocked_at').eq('user_id', userId).order('unlocked_at', { ascending: false }).limit(4)
  const unlockedAchievements: Achievement[] = (achData ?? []).map(r => ({ key: r.achievement_key as AchievementKey, unlocked_at: r.unlocked_at }))

  return {
    id: userId,
    slug,
    name: profileRow.full_name || profileRow.users?.name,
    avatar_url: profileRow.users?.avatar_url ?? null,
    age,
    position: (latest?.position || profileRow.preferred_position || 'Ponteiro') as Position,
    height: profileRow.show_height ? (latest?.height ?? null) : null,
    wingspan: profileRow.show_wingspan ? (latest?.wingspan ?? null) : null,
    vertical_jump: profileRow.show_reach ? (latest?.vertical_jump ?? null) : null,
    attack_reach: profileRow.show_reach ? (latest?.attack_reach ?? null) : null,
    block_reach: profileRow.show_reach ? (latest?.block_reach ?? null) : null,
    evaluation_date: latest?.evaluation_date ?? null,
    unlocked_achievements: unlockedAchievements,
  }
}

// ---------------------------------------------------------------------------
// PASSWORD RESETS
// ---------------------------------------------------------------------------

export async function createPasswordResetToken(email: string, code: string): Promise<void> {
  if (!isSupabase()) return
  const sb = getSupabase()!
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString()
  await sb.from('password_resets').insert({ id, email: email.toLowerCase(), code, expires_at: expiresAt, used: false })
}

export async function verifyAndUsePasswordReset(email: string, code: string, newPasswordHash: string): Promise<boolean> {
  if (!isSupabase()) return false
  const sb = getSupabase()!
  const now = new Date().toISOString()
  const { data: record } = await sb.from('password_resets')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('code', code)
    .eq('used', false)
    .gt('expires_at', now)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!record) return false

  await sb.from('password_resets').update({ used: true }).eq('id', record.id)
  await sb.from('users').update({ password_hash: newPasswordHash }).eq('email', email.toLowerCase())
  return true
}

// ---------------------------------------------------------------------------
// SEED (demonstração)
// ---------------------------------------------------------------------------

export async function ensureSeedDataSupabase(): Promise<void> {
  if (!isSupabase()) return
  const sb = getSupabase()
  if (!sb) return

  try {
    const { count, error } = await sb.from('users').select('*', { count: 'exact', head: true })
    if (error) {
      console.warn('ensureSeedDataSupabase check error:', error.message)
      return
    }
    if (count && count > 0) return

    const defaultPasswordHash = await bcrypt.hash('ifal1234', 10)

    const initialAthletes = [
      { id: 'athlete-matheus-santos', name: 'Matheus Santos', email: 'matheus.santos@ifal.edu.br', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', position: 'Ponteiro', birth_date: '2004-05-14', serve_types: ['Viagem', 'Flutuante pulando'], bio_goals: 'Evoluir consistência no ataque de ponta contra bloqueio duplo e aprimorar a potência do saque viagem nos momentos decisivos.', laterality: 'Destro', practice_time: '5 anos', evaluations: [{ date: '2025-08-10', weight: 84.5, height: 194, standingReach: 248, jumpingReach: 330, wingspan: 199, seated_height: 98, attack_reach: 338, block_reach: 333, goals: 'Aumentar impulsão vertical em 5cm e manter porcentagem de acerto no ataque acima de 55%.', laterality: 'Destro', practice_time: '5 anos' }, { date: '2025-11-20', weight: 85.2, height: 194, standingReach: 248, jumpingReach: 336, wingspan: 199, seated_height: 98, attack_reach: 344, block_reach: 339, goals: 'Foco na aceleração de passada no salto e velocidade de braço.', laterality: 'Destro', practice_time: '5 anos' }, { date: '2026-02-15', weight: 86.0, height: 195, standingReach: 249, jumpingReach: 342, wingspan: 200, seated_height: 99, attack_reach: 350, block_reach: 345, goals: 'Alcançar 345cm de alcance no ataque e consolidar recepção na linha de passe.', laterality: 'Destro', practice_time: '5 anos' }] },
      { id: 'athlete-gabriel-silva', name: 'Gabriel Silva', email: 'gabriel.silva@ifal.edu.br', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', position: 'Central', birth_date: '2003-09-22', serve_types: ['Flutuante pulando', 'Flutuante parado'], bio_goals: 'Dominar leitura rápida de levantadores adversários, velocidade de deslocamento lateral e fechamento de bloqueio triplo.', laterality: 'Destro', practice_time: '8 anos', evaluations: [{ date: '2025-09-05', weight: 92.0, height: 201, standingReach: 260, jumpingReach: 345, wingspan: 208, seated_height: 104, attack_reach: 353, block_reach: 349, goals: 'Melhorar velocidade de passada para bloqueio nas extremidades.', laterality: 'Destro', practice_time: '8 anos' }, { date: '2026-01-18', weight: 93.5, height: 202, standingReach: 261, jumpingReach: 352, wingspan: 209, seated_height: 105, attack_reach: 360, block_reach: 356, goals: 'Atingir 355cm de alcance no bloqueio e potência no primeiro tempo com o levantador.', laterality: 'Destro', practice_time: '8 anos' }] },
      { id: 'athlete-lucas-oliveira', name: 'Lucas Oliveira', email: 'lucas.oliveira@ifal.edu.br', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', position: 'Levantador', birth_date: '2005-02-10', serve_types: ['Flutuante pulando', 'Híbrido'], bio_goals: 'Precisão milimétrica nas bolas aceleradas de ponta e pipe, além de leitura tática de bloqueio adversário.', laterality: 'Destro', practice_time: '5 anos', evaluations: [{ date: '2025-08-15', weight: 76.0, height: 185, standingReach: 236, jumpingReach: 312, wingspan: 188, seated_height: 94, attack_reach: 320, block_reach: 316, goals: 'Aprimorar impulsão no salto para levantamento em suspensão.', laterality: 'Destro', practice_time: '5 anos' }, { date: '2026-02-01', weight: 77.4, height: 186, standingReach: 237, jumpingReach: 318, wingspan: 189, seated_height: 95, attack_reach: 326, block_reach: 322, goals: 'Consolidar precisão nas bolas rápidas de meio e defesa na diagonal.', laterality: 'Destro', practice_time: '5 anos' }] },
      { id: 'athlete-rafael-costa', name: 'Rafael Costa', email: 'rafael.costa@ifal.edu.br', avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', position: 'Líbero', birth_date: '2004-11-03', serve_types: ['Saque por cima', 'Flutuante parado'], bio_goals: 'Liderar a comunicação da linha defensiva, cobrir bloqueio e manter passe A acima de 70% nas partidas.', laterality: 'Destro', practice_time: '4 anos', evaluations: [{ date: '2025-09-12', weight: 68.5, height: 174, standingReach: 224, jumpingReach: 295, wingspan: 176, seated_height: 88, attack_reach: 303, block_reach: 299, goals: 'Agilidade lateral, tempo de reação e controle de manchete.', laterality: 'Destro', practice_time: '4 anos' }, { date: '2026-02-10', weight: 69.2, height: 175, standingReach: 225, jumpingReach: 302, wingspan: 177, seated_height: 89, attack_reach: 310, block_reach: 306, goals: 'Reforçar estabilidade no passe de saques viagem potentes.', laterality: 'Destro', practice_time: '4 anos' }] },
      { id: 'athlete-thiago-almeida', name: 'Thiago Almeida', email: 'thiago.almeida@ifal.edu.br', avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', position: 'Oposto', birth_date: '2003-07-19', serve_types: ['Viagem', 'Híbrido'], bio_goals: 'Ser a referência na saída de rede nos momentos de bola alta, potência no saque viagem acima de 100km/h.', laterality: 'Canhoto', practice_time: '7 anos', evaluations: [{ date: '2025-08-25', weight: 90.0, height: 198, standingReach: 254, jumpingReach: 338, wingspan: 204, seated_height: 102, attack_reach: 346, block_reach: 342, goals: 'Ganho de potência no salto e resistência física para jogos de 5 sets.', laterality: 'Canhoto', practice_time: '7 anos' }, { date: '2026-02-22', weight: 91.5, height: 198, standingReach: 254, jumpingReach: 348, wingspan: 205, seated_height: 102, attack_reach: 356, block_reach: 352, goals: 'Superar os 350cm de alcance e calibrar diagonal curta na saída.', laterality: 'Canhoto', practice_time: '7 anos' }] },
    ]

    const now = new Date().toISOString()
    for (const a of initialAthletes) {
      const slug = await generateCardSlugSupabase(a.name)
      await sb.from('users').insert({ id: a.id, email: a.email.toLowerCase(), password_hash: defaultPasswordHash, name: a.name, avatar_url: a.avatar_url, created_at: now })
      await sb.from('profiles').insert({ user_id: a.id, full_name: a.name, birth_date: a.birth_date, preferred_position: a.position, laterality: a.laterality, practice_time: a.practice_time, serve_types: a.serve_types, bio_goals: a.bio_goals, show_weight: true, show_height: true, show_reach: true, show_wingspan: true, show_goals: true, show_evaluations: true, show_in_rankings: true, public_card_enabled: false, public_card_slug: slug, updated_at: now })
      for (let i = 0; i < a.evaluations.length; i++) {
        const ev = a.evaluations[i]
        const metrics = calculateAllMetricsSupabase(a.birth_date, ev.weight, ev.height, ev.standingReach, ev.jumpingReach, ev.date, ev.attack_reach, ev.block_reach)
        await sb.from('evaluations').insert({ id: `eval-${a.id}-${i + 1}`, user_id: a.id, evaluation_date: ev.date, full_name: a.name, birth_date: a.birth_date, age: metrics.age, weight: ev.weight, height: ev.height, reach_standing: ev.standingReach, reach_jumping: ev.jumpingReach, wingspan: ev.wingspan, seated_height: ev.seated_height, attack_reach: ev.attack_reach, block_reach: ev.block_reach, laterality: ev.laterality, practice_time: ev.practice_time, vertical_jump: metrics.vertical_jump, bmi: metrics.bmi, position: a.position, serve_types: a.serve_types, goals: ev.goals, notes: 'Avaliação periódica de desempenho esportivo.', created_at: now })
      }
    }
  } catch (err) {
    console.warn('ensureSeedDataSupabase error (ignored):', err)
  }
}

// ---------------------------------------------------------------------------
// Helpers privados (Supabase)
// ---------------------------------------------------------------------------

function computeProgressPctSupabase(metricType: string | null, currentValue: number | null, targetValue: number | null): number {
  if (metricType && metricType !== 'tecnica' && currentValue !== null && targetValue !== null && targetValue !== 0) {
    const pct = (currentValue / targetValue) * 100
    return Math.max(0, Math.min(100, Math.round(pct)))
  }
  return 0
}

function computeAgeSupabase(birthDateStr: string, referenceDateStr?: string): number {
  const birth = new Date(birthDateStr)
  if (isNaN(birth.getTime())) return 0
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date()
  let age = ref.getFullYear() - birth.getFullYear()
  const m = ref.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--
  return Math.max(0, age)
}

function calculateAllMetricsSupabase(birthDate: string, weight: number, height: number, standingReach: number, jumpingReach: number, evaluationDate?: string, attackReach?: number | null, blockReach?: number | null) {
  const birth = new Date(birthDate)
  const ref = evaluationDate ? new Date(evaluationDate) : new Date()
  let age = ref.getFullYear() - birth.getFullYear()
  const m = ref.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--
  age = Math.max(0, age)

  const vertical_jump = Math.max(0, Math.round((jumpingReach - standingReach) * 10) / 10)
  const heightM = height / 100
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10

  return { age, vertical_jump, attack_reach: attackReach ?? null, block_reach: blockReach ?? null, bmi }
}
