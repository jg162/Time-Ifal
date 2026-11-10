/**
 * Camada de dados PostgreSQL/Supabase para a plataforma TIME IFAL.
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
  Team,
  TeamAthlete,
  TeamMember,
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
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!rawUrl || !serviceKey || rawUrl.includes('demo.supabase.co') || rawUrl.includes('seu-projeto.supabase.co')) return null
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
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  return Boolean(
    rawUrl &&
    serviceKey &&
    !rawUrl.includes('demo.supabase.co') &&
    !rawUrl.includes('seu-projeto.supabase.co')
  )
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
    height: row.height !== undefined ? row.height : null,
    weight: row.weight !== undefined ? row.weight : null,
    wingspan: row.wingspan !== undefined ? row.wingspan : null,
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

  const { error: profileError } = await sb.from('profiles').insert({
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

  if (profileError) {
    console.warn('Profile array insert warning, attempting fallback:', profileError.message)
    try {
      await sb.from('profiles').insert({
        user_id: user.id,
        full_name: user.name,
        preferred_position: 'Ponteiro',
        serve_types: '["Flutuante pulando"]',
        updated_at: now,
      })
    } catch (e2: any) {
      console.warn('Profile string fallback warning:', e2?.message)
    }
  }

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

  let mergedBio = data.bio_goals !== undefined ? data.bio_goals : current.bio_goals
  const existingTeam = current.bio_goals ? extractTeamMetaFromBio(current.bio_goals) : null
  if (existingTeam && (!mergedBio || !mergedBio.includes('[TEAM:'))) {
    const teamTag = `[TEAM:${JSON.stringify(existingTeam.team)}]`
    mergedBio = mergedBio ? `${teamTag} ${mergedBio.trim()}` : teamTag
  }

  const updates: any = {
    full_name: data.full_name ?? (data.name ?? current.full_name),
    birth_date: data.birth_date !== undefined ? data.birth_date : current.birth_date,
    preferred_position: data.preferred_position ?? current.preferred_position,
    laterality: data.laterality !== undefined ? data.laterality : current.laterality,
    practice_time: data.practice_time !== undefined ? data.practice_time : current.practice_time,
    serve_types: data.serve_types ? data.serve_types : current.serve_types,
    bio_goals: mergedBio,
    height: data.height !== undefined ? data.height : current.height,
    weight: data.weight !== undefined ? data.weight : current.weight,
    wingspan: data.wingspan !== undefined ? data.wingspan : current.wingspan,
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
      height: evalData.height,
      weight: evalData.weight,
      wingspan: evalData.wingspan,
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
// TEAMS & INVITES (Supabase com fallback resiliente para perfis)
// ---------------------------------------------------------------------------

interface TeamMeta {
  id: string
  name: string
  code: string
  description?: string
  created_by?: string | null
  created_at: string
}

function extractTeamMetaFromBio(bio?: string | null): { team: TeamMeta; cleanBio: string } | null {
  if (!bio) return null
  const tagStart = bio.indexOf('[TEAM:')
  if (tagStart === -1) return null
  const jsonStart = bio.indexOf('{', tagStart)
  if (jsonStart === -1) return null
  let depth = 0
  let jsonEnd = -1
  for (let i = jsonStart; i < bio.length; i++) {
    if (bio[i] === '{') depth++
    else if (bio[i] === '}') {
      depth--
      if (depth === 0) { jsonEnd = i; break }
    }
  }
  if (jsonEnd === -1) return null
  const closeBracket = bio.indexOf(']', jsonEnd)
  if (closeBracket === -1) return null
  const jsonStr = bio.substring(jsonStart, jsonEnd + 1)
  const fullTag = bio.substring(tagStart, closeBracket + 1)
  try {
    const meta = JSON.parse(jsonStr) as TeamMeta
    const cleanBio = bio.replace(fullTag, '').trim()
    return { team: meta, cleanBio }
  } catch {
    return null
  }
}

export async function createTeam(name: string, description = '', createdByUserId?: string): Promise<Team> {
  if (!isSupabase()) throw new Error('createTeam via Supabase não disponível localmente')
  const sb = getSupabase()!
  const id = 'team_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
  const prefix = name.replace(/[^a-zA-ZÀ-ÿ]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'TIME'
  const rand = Math.floor(1000 + Math.random() * 9000)
  const code = `${prefix}-${rand}`
  const now = new Date().toISOString()

  let insertedInTable = false

  // 1. Tenta inserir na tabela 'teams'
  try {
    const { error: teamErr } = await sb.from('teams').insert({
      id,
      name: name.trim(),
      code,
      description: description.trim(),
      created_by: createdByUserId || null,
      created_at: now
    })
    if (teamErr) {
      console.warn('createTeam teams table error (may not exist yet):', teamErr.message)
    } else {
      insertedInTable = true
      if (createdByUserId) {
        const { error: memberErr } = await sb.from('team_members').insert({
          id: 'tm_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          team_id: id,
          user_id: createdByUserId,
          role: 'capitao',
          joined_at: now
        })
        if (memberErr) {
          console.warn('createTeam team_members insert error:', memberErr.message)
        }
      }
    }
  } catch (e: any) {
    console.warn('createTeam try/catch:', e?.message)
  }

  // 2. Fallback resiliente: armazena tag no perfil do criador
  // Usado tanto como backup quanto como única estratégia se a tabela não existe
  if (createdByUserId) {
    try {
      // Garantir que o perfil exista (upsert)
      const { data: prof } = await sb.from('profiles').select('bio_goals, full_name').eq('user_id', createdByUserId).maybeSingle()
      const teamTag = `[TEAM:${JSON.stringify({ id, name: name.trim(), code, description: description.trim(), created_by: createdByUserId, created_at: now, role: 'capitao' })}]`

      if (!prof) {
        // Perfil não existe ainda — criar com a tag
        const { data: userData } = await sb.from('users').select('name').eq('id', createdByUserId).maybeSingle()
        await sb.from('profiles').insert({
          user_id: createdByUserId,
          full_name: userData?.name || '',
          preferred_position: 'Ponteiro',
          serve_types: '[]',
          bio_goals: teamTag,
          show_weight: true,
          show_height: true,
          show_reach: true,
          show_wingspan: true,
          show_goals: true,
          show_evaluations: true,
          show_in_rankings: true,
          created_at: now,
          updated_at: now,
        })
      } else {
        const existingBio = extractTeamMetaFromBio(prof.bio_goals)?.cleanBio ?? (prof.bio_goals || '')
        const updatedBio = existingBio ? `${teamTag} ${existingBio}` : teamTag
        await sb.from('profiles').update({ bio_goals: updatedBio }).eq('user_id', createdByUserId)
      }
    } catch (e: any) {
      console.error('createTeam profile fallback error:', e?.message)
      // Se tudo falhar, lançamos exceção para o usuário saber
      if (!insertedInTable) {
        throw new Error('Não foi possível salvar os dados do time. Por favor, complete seu perfil antes de criar um time.')
      }
    }
  }

  return {
    id,
    name: name.trim(),
    code,
    description: description.trim(),
    created_by: createdByUserId || null,
    created_at: now,
    members_count: 1
  }
}

export async function getTeamByCode(code: string): Promise<Team | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!
  const cleanCode = code.trim().toUpperCase()

  // 1. Tenta buscar na tabela 'teams'
  try {
    const { data, error } = await sb.from('teams').select('*').ilike('code', cleanCode).maybeSingle()
    if (!error && data) {
      const { count } = await sb.from('team_members').select('id', { count: 'exact', head: true }).eq('team_id', data.id)
      return {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        created_by: data.created_by,
        created_at: data.created_at,
        members_count: count ?? 1
      }
    }
  } catch {
    // fallback
  }

  // 2. Fallback: busca em profiles com a tag [TEAM:...]
  try {
    const { data: profiles } = await sb.from('profiles').select('bio_goals')
    if (profiles) {
      for (const p of profiles) {
        const parsed = extractTeamMetaFromBio(p.bio_goals)
        if (parsed && parsed.team.code.toUpperCase() === cleanCode) {
          const membersCount = profiles.filter(pr => {
            const m = extractTeamMetaFromBio(pr.bio_goals)
            return m && m.team.id === parsed.team.id
          }).length
          return {
            ...parsed.team,
            members_count: membersCount || 1
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return null
}

export async function getTeamById(id: string): Promise<Team | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!

  try {
    const { data, error } = await sb.from('teams').select('*').eq('id', id).maybeSingle()
    if (!error && data) {
      const { count } = await sb.from('team_members').select('id', { count: 'exact', head: true }).eq('team_id', data.id)
      return {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        created_by: data.created_by,
        created_at: data.created_at,
        members_count: count ?? 1
      }
    }
  } catch {
    // fallback
  }

  try {
    const { data: profiles } = await sb.from('profiles').select('bio_goals')
    if (profiles) {
      for (const p of profiles) {
        const parsed = extractTeamMetaFromBio(p.bio_goals)
        if (parsed && parsed.team.id === id) {
          const membersCount = profiles.filter(pr => {
            const m = extractTeamMetaFromBio(pr.bio_goals)
            return m && m.team.id === id
          }).length
          return {
            ...parsed.team,
            members_count: membersCount || 1
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return null
}

export async function getUserTeam(userId: string): Promise<Team | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!

  // 1. Tenta via team_members
  try {
    const { data: member, error } = await sb.from('team_members').select('team_id').eq('user_id', userId).maybeSingle()
    if (!error && member?.team_id) {
      return getTeamById(member.team_id)
    }
  } catch {
    // fallback
  }

  // 2. Fallback via perfil
  try {
    const { data: prof } = await sb.from('profiles').select('bio_goals').eq('user_id', userId).maybeSingle()
    const parsed = extractTeamMetaFromBio(prof?.bio_goals)
    if (parsed) {
      const full = await getTeamById(parsed.team.id)
      return full ?? {
        id: parsed.team.id,
        name: parsed.team.name,
        code: parsed.team.code,
        description: parsed.team.description || '',
        created_by: parsed.team.created_by,
        created_at: parsed.team.created_at,
        members_count: 1
      }
    }
  } catch {
    // ignore
  }

  return null
}

export async function addUserToTeam(userId: string, teamId: string, role = 'atleta'): Promise<void> {
  if (!isSupabase()) return
  const sb = getSupabase()!
  const now = new Date().toISOString()

  // 1. Tenta adicionar na tabela 'team_members'
  try {
    const { error } = await sb.from('team_members').upsert({
      id: 'tm_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      team_id: teamId,
      user_id: userId,
      role,
      joined_at: now
    }, { onConflict: 'team_id, user_id' })
    if (error) {
      console.warn('addUserToTeam team_members error:', error.message)
    }
  } catch (e: any) {
    console.warn('addUserToTeam team_members exception:', e?.message)
  }

  // 2. Fallback: atualiza/cria tag no perfil
  try {
    const team = await getTeamById(teamId)
    if (team) {
      const { data: prof } = await sb.from('profiles').select('bio_goals').eq('user_id', userId).maybeSingle()
      const teamTag = `[TEAM:${JSON.stringify({ id: team.id, name: team.name, code: team.code, description: team.description || '', role })}]`

      if (!prof) {
        // Criar perfil básico com a tag do time
        const { data: userData } = await sb.from('users').select('name').eq('id', userId).maybeSingle()
        await sb.from('profiles').insert({
          user_id: userId,
          full_name: userData?.name || '',
          preferred_position: 'Ponteiro',
          serve_types: '[]',
          bio_goals: teamTag,
          show_weight: true,
          show_height: true,
          show_reach: true,
          show_wingspan: true,
          show_goals: true,
          show_evaluations: true,
          show_in_rankings: true,
          created_at: now,
          updated_at: now,
        })
      } else {
        const existingBio = extractTeamMetaFromBio(prof.bio_goals)?.cleanBio ?? (prof.bio_goals || '')
        const updatedBio = existingBio ? `${teamTag} ${existingBio}` : teamTag
        await sb.from('profiles').update({ bio_goals: updatedBio }).eq('user_id', userId)
      }
    }
  } catch (e: any) {
    console.warn('addUserToTeam profile fallback error:', e?.message)
  }
}

export async function removeUserFromTeam(userId: string, teamId: string): Promise<void> {
  if (!isSupabase()) return
  const sb = getSupabase()!

  // 1. Tenta deletar de team_members
  try {
    await sb.from('team_members').delete().eq('user_id', userId).eq('team_id', teamId)
  } catch (e: any) {
    console.warn('removeUserFromTeam team_members error:', e?.message)
  }

  // 2. Fallback: limpa a tag do perfil
  try {
    const { data: prof } = await sb.from('profiles').select('bio_goals').eq('user_id', userId).maybeSingle()
    if (prof?.bio_goals) {
      const cleanBio = extractTeamMetaFromBio(prof.bio_goals)?.cleanBio ?? prof.bio_goals
      await sb.from('profiles').update({ bio_goals: cleanBio }).eq('user_id', userId)
    }
  } catch (e: any) {
    console.warn('removeUserFromTeam profile fallback error:', e?.message)
  }
}

export async function updateTeam(teamId: string, updates: { name?: string; description?: string; code?: string }): Promise<Team | null> {
  if (!isSupabase()) return null
  const sb = getSupabase()!

  const current = await getTeamById(teamId)
  if (!current) return null

  const newName = updates.name !== undefined ? updates.name.trim() : current.name
  const newDesc = updates.description !== undefined ? updates.description.trim() : current.description
  const newCode = updates.code !== undefined ? updates.code.trim().toUpperCase() : current.code

  // 1. Tenta atualizar na tabela teams
  try {
    await sb.from('teams').update({
      name: newName,
      description: newDesc,
      code: newCode
    }).eq('id', teamId)
  } catch {}

  // 2. Fallback: atualiza tags nos perfis
  try {
    const { data: profiles } = await sb.from('profiles').select('user_id, bio_goals')
    if (profiles) {
      for (const p of profiles) {
        const parsed = extractTeamMetaFromBio(p.bio_goals)
        if (parsed && parsed.team.id === teamId) {
          const updatedTag = `[TEAM:${JSON.stringify({
            ...parsed.team,
            name: newName,
            description: newDesc,
            code: newCode
          })}]`
          const newBio = parsed.cleanBio ? `${updatedTag} ${parsed.cleanBio}` : updatedTag
          await sb.from('profiles').update({ bio_goals: newBio }).eq('user_id', p.user_id)
        }
      }
    }
  } catch {}

  return getTeamById(teamId)
}

// ---------------------------------------------------------------------------
// TEAM
// ---------------------------------------------------------------------------

export async function getAllTeamAthletes(requestingUserId?: string, teamIdFilter?: string): Promise<TeamAthlete[]> {
  if (!isSupabase()) return []
  const sb = getSupabase()!

  let targetTeamId = teamIdFilter
  if (!targetTeamId && requestingUserId) {
    const userTeam = await getUserTeam(requestingUserId)
    targetTeamId = userTeam?.id
  }

  // Se o usuário não tem time e nenhum time foi informado, elenco inicia vazio
  if (!targetTeamId) {
    return []
  }

  // Descobre quais user_ids fazem parte deste time
  let memberUserIds: string[] = []
  try {
    const { data: members, error } = await sb.from('team_members').select('user_id').eq('team_id', targetTeamId)
    if (!error && members && members.length > 0) {
      memberUserIds = members.map(m => m.user_id)
    }
  } catch {
    // fallback
  }

  const { data: profiles, error: pErr } = await sb.from('profiles').select('*')
  if (pErr || !profiles) return []

  if (memberUserIds.length === 0) {
    for (const p of profiles) {
      const parsed = extractTeamMetaFromBio(p.bio_goals)
      if (parsed && parsed.team.id === targetTeamId) {
        memberUserIds.push(p.user_id)
      }
    }
  }

  if (memberUserIds.length === 0) {
    return []
  }

  const { data: users, error: uErr } = await sb.from('users').select('id, name, avatar_url').in('id', memberUserIds)
  if (uErr || !users) return []

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

    const parsedBio = extractTeamMetaFromBio(p?.bio_goals)
    const displayGoals = parsedBio ? parsedBio.cleanBio : (p?.bio_goals || '')

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
      goals: showGoals ? (latestEval?.goals || displayGoals || null) : null,
      last_updated: latestEval?.evaluation_date || p?.updated_at || null,
      evaluations_count: showEvaluations ? evalCount : 0,
      is_self: isSelf,
      team_id: targetTeamId,
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

  // 1. Buscar perfis elegíveis com show_in_rankings !== false
  const { data: profiles, error: pErr } = await sb.from('profiles').select('user_id, show_in_rankings, show_height, show_reach, show_wingspan, show_weight')
  if (pErr || !profiles) return []

  const eligibleUserIds = new Set<string>()
  for (const p of profiles) {
    if (p.show_in_rankings === false) continue
    // Checar privacidade específica da métrica
    if (field === 'height' && p.show_height === false) continue
    if (field === 'wingspan' && p.show_wingspan === false) continue
    if ((field === 'reach_jumping' || field === 'vertical_jump' || field === 'attack_reach' || field === 'block_reach') && p.show_reach === false) continue
    eligibleUserIds.add(p.user_id)
  }

  if (eligibleUserIds.size === 0) return []

  // 2. Buscar avaliações dos usuários elegíveis
  const { data, error } = await sb.from('evaluations')
    .select('*, users(name, avatar_url)')
    .in('user_id', Array.from(eligibleUserIds))
  if (error || !data) return []

  // 3. Pegar a avaliação mais recente de cada atleta com valor válido (> 0)
  const byUser = new Map<string, any>()
  for (const r of data) {
    const val = r[field]
    if (val === null || val === undefined || Number(val) <= 0) continue
    if (!byUser.has(r.user_id) || r.evaluation_date > byUser.get(r.user_id).evaluation_date) {
      byUser.set(r.user_id, r)
    }
  }

  const ordered = Array.from(byUser.values())
    .map(r => ({
      athlete_id: r.user_id,
      name: r.full_name || (r.users as any)?.name || 'Atleta',
      avatar_url: (r.users as any)?.avatar_url ?? null,
      position: r.position,
      value: Number(r[field]),
      evaluation_date: r.evaluation_date,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)

  // 4. Calcular posições permitindo empates
  let currentRank = 1
  return ordered.map((r, i) => {
    if (i > 0 && r.value < ordered[i - 1].value) {
      currentRank = i + 1
    }
    return { ...r, rank: currentRank }
  })
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

export async function deleteUserAccount(userId: string): Promise<boolean> {
  if (!isSupabase()) return false
  const sb = getSupabase()!
  try {
    await sb.from('evaluations').delete().eq('user_id', userId)
    await sb.from('goals').delete().eq('user_id', userId)
    await sb.from('achievements').delete().eq('user_id', userId)
    try {
      await sb.from('team_members').delete().eq('user_id', userId)
    } catch {}
    await sb.from('profiles').delete().eq('user_id', userId)
    const { error } = await sb.from('users').delete().eq('id', userId)
    return !error
  } catch (err) {
    console.error('Error deleting user account in Supabase:', err)
    return false
  }
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
// SEED (limpeza de dados de demonstração)
// ---------------------------------------------------------------------------

export async function ensureSeedDataSupabase(): Promise<void> {
  if (!isSupabase()) return
  const sb = getSupabase()
  if (!sb) return

  try {
    // Remove todos os atletas mock / seed para manter o banco limpo
    await sb.from('evaluations').delete().like('id', 'eval-athlete-%')
    await sb.from('evaluations').delete().like('user_id', 'athlete-%')
    await sb.from('profiles').delete().like('user_id', 'athlete-%')
    await sb.from('users').delete().like('id', 'athlete-%')
  } catch (err) {
    console.warn('ensureSeedDataSupabase cleanup error (ignored):', err)
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
