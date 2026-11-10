import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { calculateAge, calculateBMI } from './calculations';
import {
  Achievement,
  AchievementKey,
  AthleteCardData,
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
} from './types';

// Singleton database instance
let dbInstance: Database.Database | null = null;

function resolveDatabasePath(): string {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const preferredDir = isServerless
    ? path.join(os.tmpdir(), 'time-ifal-data')
    : path.join(process.cwd(), 'data');

  if (!fs.existsSync(preferredDir)) {
    try {
      fs.mkdirSync(preferredDir, { recursive: true });
    } catch {
      // Se process.cwd() for somente-leitura (ex: Vercel), faz fallback para tmp
      const tmpDir = path.join(os.tmpdir(), 'time-ifal-data');
      try {
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
      } catch {
        // ignora
      }
      return path.join(tmpDir, 'volleyball.db');
    }
  }

  return path.join(preferredDir, 'volleyball.db');
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbPath = resolveDatabasePath();
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);
  }
  return dbInstance;
}

function addColumnIfMissing(db: Database.Database, table: string, column: string, definition: string) {
  const columns = (db.prepare(`PRAGMA table_info(${table})`).all() as any[]).map((c) => c.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      birth_date TEXT,
      preferred_position TEXT NOT NULL DEFAULT 'Ponteiro',
      serve_types TEXT NOT NULL DEFAULT '[]',
      bio_goals TEXT DEFAULT '',
      practice_time TEXT DEFAULT '',
      show_weight INTEGER NOT NULL DEFAULT 1,
      show_height INTEGER NOT NULL DEFAULT 1,
      show_reach INTEGER NOT NULL DEFAULT 1,
      show_wingspan INTEGER NOT NULL DEFAULT 1,
      show_goals INTEGER NOT NULL DEFAULT 1,
      show_evaluations INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      evaluation_date TEXT NOT NULL,
      full_name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      age INTEGER NOT NULL,
      weight REAL NOT NULL,
      height REAL NOT NULL,
      reach_standing REAL NOT NULL,
      reach_jumping REAL NOT NULL,
      wingspan REAL NOT NULL,
      vertical_jump REAL NOT NULL,
      bmi REAL NOT NULL,
      position TEXT NOT NULL,
      serve_types TEXT NOT NULL,
      goals TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      metric_type TEXT,
      current_value REAL,
      target_value REAL,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'ativo',
      progress_pct REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_key TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      UNIQUE(user_id, achievement_key)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      created_by TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'atleta',
      joined_at TEXT NOT NULL,
      UNIQUE(team_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluation_date);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);
    CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
  `);

  // -------
  // Idempotent migrations for tables created by older versions of the app.
  // Existing data (users, profiles, evaluations) is always preserved.
  // -------
  addColumnIfMissing(db, 'profiles', 'laterality', 'TEXT');
  addColumnIfMissing(db, 'profiles', 'practice_time', "TEXT DEFAULT ''");
  addColumnIfMissing(db, 'profiles', 'show_in_rankings', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfMissing(db, 'profiles', 'public_card_enabled', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'profiles', 'public_card_slug', 'TEXT');
  addColumnIfMissing(db, 'profiles', 'team_id', 'TEXT');
  addColumnIfMissing(db, 'profiles', 'height', 'REAL');
  addColumnIfMissing(db, 'profiles', 'weight', 'REAL');
  addColumnIfMissing(db, 'profiles', 'wingspan', 'REAL');
  addColumnIfMissing(db, 'profiles', 'avatar_url', 'TEXT');

  addColumnIfMissing(db, 'evaluations', 'seated_height', 'REAL');
  addColumnIfMissing(db, 'evaluations', 'attack_reach', 'REAL');
  addColumnIfMissing(db, 'evaluations', 'block_reach', 'REAL');
  addColumnIfMissing(db, 'evaluations', 'laterality', 'TEXT');
  addColumnIfMissing(db, 'evaluations', 'practice_time', "TEXT DEFAULT ''");
}

// ----------------- EVALUATION SERIALIZATION -----------------
const EVAL_KEYS = [
  'id',
  'user_id',
  'evaluation_date',
  'full_name',
  'birth_date',
  'age',
  'weight',
  'height',
  'reach_standing',
  'reach_jumping',
  'wingspan',
  'seated_height',
  'attack_reach',
  'block_reach',
  'laterality',
  'practice_time',
  'vertical_jump',
  'bmi',
] as const;

function rowToEvaluation(r: any): Evaluation {
  return {
    id: r.id,
    user_id: r.user_id,
    evaluation_date: r.evaluation_date,
    full_name: r.full_name,
    birth_date: r.birth_date,
    age: r.age,
    weight: r.weight,
    height: r.height,
    reach_standing: r.reach_standing,
    reach_jumping: r.reach_jumping,
    wingspan: r.wingspan,
    seated_height: r.seated_height ?? null,
    attack_reach: r.attack_reach ?? null,
    block_reach: r.block_reach ?? null,
    laterality: r.laterality ?? null,
    practice_time: r.practice_time ?? '',
    vertical_jump: r.vertical_jump,
    bmi: r.bmi,
    position: r.position as Position,
    serve_types: JSON.parse(r.serve_types || '[]'),
    goals: r.goals,
    notes: r.notes,
    created_at: r.created_at,
  };
}

// ----------------- USER HELPERS -----------------
export function getUserByEmail(email: string): (User & { password_hash: string }) | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
  return (stmt.get(email) as any) || null;
}

export function getUserById(id: string): User | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?');
  const user = (stmt.get(id) as any) || null;
  if (user && !user.avatar_url) {
    try {
      const pRow = db.prepare('SELECT avatar_url FROM profiles WHERE user_id = ?').get(id) as any;
      if (pRow?.avatar_url) {
        user.avatar_url = pRow.avatar_url;
      }
    } catch {}
  }
  return user;
}

export function createUser(user: { id: string; email: string; password_hash: string; name: string; avatar_url?: string }): User {
  const db = getDatabase();
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertProfile = db.prepare(`
    INSERT INTO profiles (
      user_id, full_name, birth_date, preferred_position, serve_types, bio_goals, practice_time,
      show_weight, show_height, show_reach, show_wingspan, show_goals, show_evaluations,
      show_in_rankings, public_card_enabled, public_card_slug, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 0, ?, ?)
  `);

  const slug = generateCardSlug(user.name);

  const runTx = db.transaction(() => {
    insertUser.run(user.id, user.email.toLowerCase(), user.password_hash, user.name, user.avatar_url || null, now);
    insertProfile.run(
      user.id,
      user.name,
      null,
      'Ponteiro',
      JSON.stringify(['Flutuante pulando']),
      '',
      '',
      slug,
      now
    );
  });

  runTx();

  return {
    id: user.id,
    email: user.email.toLowerCase(),
    name: user.name,
    avatar_url: user.avatar_url || null,
    created_at: now
  };
}

export function updateUserPassword(userId: string, passwordHash: string): void {
  const db = getDatabase();
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
}

// ----------------- PROFILE HELPERS -----------------
export function getProfileByUserId(userId: string): Profile | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?');
  const row = stmt.get(userId) as any;
  if (!row) return null;

  let uRow: any = null;
  try {
    uRow = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(userId);
  } catch {}
  const avatarUrl = row.avatar_url || uRow?.avatar_url || null;

  let height = row.height ?? null;
  let weight = row.weight ?? null;
  let wingspan = row.wingspan ?? null;

  if (height == null || weight == null || wingspan == null) {
    try {
      const latestEv = db.prepare('SELECT height, weight, wingspan FROM evaluations WHERE user_id = ? ORDER BY evaluation_date DESC, created_at DESC LIMIT 1').get(userId) as any;
      if (latestEv) {
        if (height == null && latestEv.height != null) height = latestEv.height;
        if (weight == null && latestEv.weight != null) weight = latestEv.weight;
        if (wingspan == null && latestEv.wingspan != null) wingspan = latestEv.wingspan;
      }
    } catch {}
  }

  return {
    user_id: row.user_id,
    full_name: row.full_name,
    birth_date: row.birth_date,
    preferred_position: row.preferred_position as Position,
    laterality: row.laterality ?? null,
    practice_time: row.practice_time ?? '',
    serve_types: JSON.parse(row.serve_types || '[]'),
    bio_goals: row.bio_goals,
    height,
    weight,
    wingspan,
    avatar_url: avatarUrl,
    show_weight: Boolean(row.show_weight),
    show_height: Boolean(row.show_height),
    show_reach: Boolean(row.show_reach),
    show_wingspan: Boolean(row.show_wingspan),
    show_goals: Boolean(row.show_goals),
    show_evaluations: Boolean(row.show_evaluations),
    show_in_rankings: row.show_in_rankings === undefined ? true : Boolean(row.show_in_rankings),
    public_card_enabled: Boolean(row.public_card_enabled),
    public_card_slug: row.public_card_slug ?? null,
    updated_at: row.updated_at
  };
}

export function updateProfile(userId: string, data: Partial<Profile> & { name?: string; avatar_url?: string }): Profile {
  const db = getDatabase();
  const now = new Date().toISOString();

  let current = getProfileByUserId(userId);
  if (!current) {
    const user = getUserById(userId);
    const defName = data.full_name || data.name || user?.name || 'Atleta';
    db.prepare(`
      INSERT INTO profiles (
        user_id, full_name, birth_date, preferred_position, serve_types, bio_goals, practice_time,
        show_weight, show_height, show_reach, show_wingspan, show_goals, show_evaluations,
        show_in_rankings, public_card_enabled, public_card_slug, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 0, ?, ?)
    `).run(
      userId,
      defName,
      null,
      data.preferred_position || 'Ponteiro',
      '["Flutuante pulando"]',
      '',
      '',
      generateCardSlug(defName),
      now
    );
    current = getProfileByUserId(userId);
  }

  const tx = db.transaction(() => {
    if (data.name !== undefined || data.avatar_url !== undefined) {
      const userUpdates: string[] = [];
      const userParams: any[] = [];
      if (data.name !== undefined && data.name && data.name.trim() !== '') {
        userUpdates.push('name = ?');
        userParams.push(data.name.trim());
      }
      if (data.avatar_url !== undefined) {
        userUpdates.push('avatar_url = ?');
        userParams.push(data.avatar_url && data.avatar_url.trim() !== '' ? data.avatar_url.trim() : null);
      }
      if (userUpdates.length > 0) {
        userParams.push(userId);
        db.prepare(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`).run(...userParams);
      }
    }

    const updated = {
      full_name: data.full_name ?? (data.name ?? current!.full_name),
      birth_date: data.birth_date !== undefined ? (data.birth_date ? data.birth_date.split('T')[0] : null) : current!.birth_date,
      preferred_position: data.preferred_position ?? current!.preferred_position,
      laterality: data.laterality !== undefined ? data.laterality : current!.laterality,
      practice_time: data.practice_time !== undefined ? data.practice_time : current!.practice_time,
      serve_types: data.serve_types ? JSON.stringify(data.serve_types) : JSON.stringify(current!.serve_types),
      bio_goals: data.bio_goals !== undefined ? data.bio_goals : current!.bio_goals,
      height: data.height !== undefined ? data.height : current!.height,
      weight: data.weight !== undefined ? data.weight : current!.weight,
      wingspan: data.wingspan !== undefined ? data.wingspan : current!.wingspan,
      show_weight: data.show_weight !== undefined ? toInt(data.show_weight) : toInt(current!.show_weight),
      show_height: data.show_height !== undefined ? toInt(data.show_height) : toInt(current!.show_height),
      show_reach: data.show_reach !== undefined ? toInt(data.show_reach) : toInt(current!.show_reach),
      show_wingspan: data.show_wingspan !== undefined ? toInt(data.show_wingspan) : toInt(current!.show_wingspan),
      show_goals: data.show_goals !== undefined ? toInt(data.show_goals) : toInt(current!.show_goals),
      show_evaluations: data.show_evaluations !== undefined ? toInt(data.show_evaluations) : toInt(current!.show_evaluations),
      show_in_rankings: data.show_in_rankings !== undefined ? toInt(data.show_in_rankings) : toInt(current!.show_in_rankings),
      public_card_enabled: data.public_card_enabled !== undefined ? toInt(data.public_card_enabled) : toInt(current!.public_card_enabled),
      public_card_slug:
        data.public_card_slug !== undefined
          ? data.public_card_slug
          : (current!.public_card_slug || generateCardSlug(current!.full_name)),
    };

    db.prepare(`
      UPDATE profiles
      SET full_name = ?,
          birth_date = ?,
          preferred_position = ?,
          laterality = ?,
          practice_time = ?,
          serve_types = ?,
          bio_goals = ?,
          height = ?,
          weight = ?,
          wingspan = ?,
          avatar_url = COALESCE(?, avatar_url),
          show_weight = ?,
          show_height = ?,
          show_reach = ?,
          show_wingspan = ?,
          show_goals = ?,
          show_evaluations = ?,
          show_in_rankings = ?,
          public_card_enabled = ?,
          public_card_slug = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(
      updated.full_name,
      updated.birth_date,
      updated.preferred_position,
      updated.laterality,
      updated.practice_time,
      updated.serve_types,
      updated.bio_goals,
      updated.height ?? null,
      updated.weight ?? null,
      updated.wingspan ?? null,
      data.avatar_url !== undefined ? (data.avatar_url && data.avatar_url.trim() !== '' ? data.avatar_url.trim() : null) : null,
      updated.show_weight,
      updated.show_height,
      updated.show_reach,
      updated.show_wingspan,
      updated.show_goals,
      updated.show_evaluations,
      updated.show_in_rankings,
      updated.public_card_enabled,
      updated.public_card_slug,
      now,
      userId
    );
  });

  tx();
  return getProfileByUserId(userId)!;
}

function toInt(v: boolean): 1 | 0 {
  return v ? 1 : 0;
}

// ----------------- EVALUATION HELPERS -----------------
export function createEvaluation(evalData: Omit<Evaluation, 'created_at'>): Evaluation {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO evaluations (
      id, user_id, evaluation_date, full_name, birth_date, age,
      weight, height, reach_standing, reach_jumping, wingspan,
      seated_height, attack_reach, block_reach, laterality, practice_time,
      vertical_jump, bmi, position, serve_types, goals, notes, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    evalData.id,
    evalData.user_id,
    evalData.evaluation_date,
    evalData.full_name,
    evalData.birth_date,
    evalData.age,
    evalData.weight,
    evalData.height,
    evalData.reach_standing,
    evalData.reach_jumping,
    evalData.wingspan,
    evalData.seated_height,
    evalData.attack_reach,
    evalData.block_reach,
    evalData.laterality,
    evalData.practice_time || '',
    evalData.vertical_jump,
    evalData.bmi,
    evalData.position,
    JSON.stringify(evalData.serve_types),
    evalData.goals,
    evalData.notes || '',
    now
  );

  // Sync profile metadata so the TIME area and card stay consistent
  try {
    db.prepare(`
      UPDATE profiles
      SET full_name = ?,
          birth_date = ?,
          preferred_position = ?,
          laterality = COALESCE(?, laterality),
          practice_time = ?,
          serve_types = ?,
          bio_goals = ?,
          height = ?,
          weight = ?,
          wingspan = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(
      evalData.full_name,
      evalData.birth_date,
      evalData.position,
      evalData.laterality,
      evalData.practice_time || '',
      JSON.stringify(evalData.serve_types),
      evalData.goals,
      evalData.height,
      evalData.weight,
      evalData.wingspan,
      now,
      evalData.user_id
    );
  } catch (err) {
    console.error('Failed to sync profile on evaluation:', err);
  }

  return {
    ...evalData,
    created_at: now
  };
}

export function getEvaluationsByUserId(userId: string): Evaluation[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM evaluations
    WHERE user_id = ?
    ORDER BY evaluation_date ASC, created_at ASC
  `);
  const rows = stmt.all(userId) as any[];
  return rows.map(rowToEvaluation);
}

export function getEvaluationById(id: string, userId?: string): Evaluation | null {
  const db = getDatabase();
  let row;
  if (userId) {
    row = db.prepare('SELECT * FROM evaluations WHERE id = ? AND user_id = ?').get(id, userId) as any;
  } else {
    row = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id) as any;
  }
  return row ? rowToEvaluation(row) : null;
}

export function deleteEvaluation(id: string, userId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM evaluations WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// ----------------- TEAMS & MEMBERS -----------------

export function createTeam(name: string, description = '', createdByUserId?: string): Team {
  const db = getDatabase();
  const id = 'team_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'TIME';
  const rand = Math.floor(1000 + Math.random() * 9000);
  const code = `${prefix}-${rand}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO teams (id, name, code, description, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), code, description.trim(), createdByUserId || null, now);

  if (createdByUserId) {
    addUserToTeam(createdByUserId, id, 'capitao');
  }

  return {
    id,
    name: name.trim(),
    code,
    description: description.trim(),
    created_by: createdByUserId || null,
    created_at: now,
    members_count: 1
  };
}

export function getTeamByCode(code: string): Team | null {
  const db = getDatabase();
  const cleanCode = code.trim().toUpperCase();
  const row = db.prepare('SELECT * FROM teams WHERE UPPER(code) = ?').get(cleanCode) as any;
  if (!row) return null;
  const countRow = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(row.id) as any;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    created_by: row.created_by,
    created_at: row.created_at,
    members_count: countRow?.count || 0
  };
}

export function getTeamById(id: string): Team | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as any;
  if (!row) return null;
  const countRow = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(row.id) as any;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    created_by: row.created_by,
    created_at: row.created_at,
    members_count: countRow?.count || 0
  };
}

export function getUserTeam(userId: string): Team | null {
  const db = getDatabase();
  const member = db.prepare('SELECT team_id FROM team_members WHERE user_id = ?').get(userId) as any;
  if (member?.team_id) {
    return getTeamById(member.team_id);
  }
  const prof = db.prepare('SELECT team_id FROM profiles WHERE user_id = ?').get(userId) as any;
  if (prof?.team_id) {
    return getTeamById(prof.team_id);
  }
  return null;
}

export function addUserToTeam(userId: string, teamId: string, role = 'atleta'): void {
  const db = getDatabase();
  const memberId = 'tm_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR REPLACE INTO team_members (id, team_id, user_id, role, joined_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(memberId, teamId, userId, role, now);

  db.prepare('UPDATE profiles SET team_id = ? WHERE user_id = ?').run(teamId, userId);
}

export function removeUserFromTeam(userId: string, teamId: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM team_members WHERE user_id = ? AND team_id = ?').run(userId, teamId);
  db.prepare('UPDATE profiles SET team_id = NULL WHERE user_id = ? AND team_id = ?').run(userId, teamId);
}

export function updateTeam(teamId: string, updates: { name?: string; description?: string; code?: string }): Team | null {
  const db = getDatabase();
  const current = getTeamById(teamId);
  if (!current) return null;

  const newName = updates.name !== undefined ? updates.name.trim() : current.name;
  const newDesc = updates.description !== undefined ? updates.description.trim() : current.description;
  const newCode = updates.code !== undefined ? updates.code.trim().toUpperCase() : current.code;

  db.prepare('UPDATE teams SET name = ?, description = ?, code = ? WHERE id = ?').run(
    newName,
    newDesc,
    newCode,
    teamId
  );

  return getTeamById(teamId);
}

// ----------------- TEAM HELPERS WITH PRIVACY -----------------
export function getAllTeamAthletes(requestingUserId?: string, teamIdFilter?: string): TeamAthlete[] {
  const db = getDatabase();

  let targetTeamId = teamIdFilter;
  if (!targetTeamId && requestingUserId) {
    const userTeam = getUserTeam(requestingUserId);
    targetTeamId = userTeam?.id;
  }

  // Se não foi especificado time e o usuário não pertence a nenhum, retorna vazio
  if (!targetTeamId) {
    return [];
  }

  const query = `
    SELECT
      u.id,
      u.name,
      u.avatar_url,
      p.full_name,
      p.birth_date,
      p.preferred_position,
      p.laterality,
      p.practice_time,
      p.serve_types,
      p.bio_goals,
      p.height,
      p.weight,
      p.wingspan,
      p.updated_at,
      tm.role as team_role
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE tm.team_id = ?
    ORDER BY u.name ASC
  `;

  const rows = db.prepare(query).all(targetTeamId) as any[];

  return rows.map(row => {
    const isSelf = requestingUserId === row.id;

    // Get latest evaluation for this athlete
    const latestEval = db.prepare(`
      SELECT * FROM evaluations
      WHERE user_id = ?
      ORDER BY evaluation_date DESC, created_at DESC
      LIMIT 1
    `).get(row.id) as any;

    const evalCount = (db.prepare('SELECT COUNT(*) as count FROM evaluations WHERE user_id = ?').get(row.id) as any)?.count || 0;

    let serveTypes: ServeType[] = [];
    try {
      serveTypes = latestEval ? JSON.parse(latestEval.serve_types) : JSON.parse(row.serve_types || '[]');
    } catch {
      serveTypes = [];
    }

    const birthDate = row.birth_date || latestEval?.birth_date || null;
    const computedAge = latestEval?.age ?? (birthDate ? calculateAge(birthDate) : null);
    const height = latestEval?.height ?? row.height ?? null;
    const weight = latestEval?.weight ?? row.weight ?? null;
    const wingspan = latestEval?.wingspan ?? row.wingspan ?? null;

    return {
      id: row.id,
      name: row.full_name || row.name,
      avatar_url: row.avatar_url,
      position: (latestEval?.position || row.preferred_position || 'Ponteiro') as Position,
      laterality: latestEval?.laterality || row.laterality || null,
      birth_date: birthDate,
      age: computedAge,
      height,
      weight,
      reach_standing: latestEval?.reach_standing ?? null,
      reach_jumping: latestEval?.reach_jumping ?? null,
      wingspan,
      vertical_jump: latestEval?.vertical_jump ?? null,
      attack_reach: latestEval?.attack_reach ?? null,
      block_reach: latestEval?.block_reach ?? null,
      bmi: latestEval?.bmi ?? (weight && height ? calculateBMI(weight, height) : null),
      serve_types: serveTypes,
      practice_time: row.practice_time || latestEval?.practice_time || null,
      goals: latestEval?.goals || row.bio_goals || null,
      last_updated: latestEval?.evaluation_date || row.updated_at || null,
      evaluations_count: evalCount,
      is_self: isSelf,
      privacy: {
        show_weight: true,
        show_height: true,
        show_reach: true,
        show_wingspan: true,
        show_goals: true,
        show_evaluations: true
      }
    };
  });
}

export function getAthleteDetails(athleteId: string, requestingUserId?: string) {
  const athletes = getAllTeamAthletes(requestingUserId);
  const athlete = athletes.find(a => a.id === athleteId);
  if (!athlete) return null;

  const isSelf = requestingUserId === athleteId;
  const showEvaluations = isSelf || athlete.privacy.show_evaluations;

  let evaluations: Evaluation[] = [];
  if (showEvaluations) {
    evaluations = getEvaluationsByUserId(athleteId).map(ev => {
      return {
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
      };
    });
  }

  return {
    athlete,
    evaluations
  };
}

// ----------------- RANKINGS -----------------
type RankingField = 'reach_jumping' | 'vertical_jump' | 'attack_reach' | 'block_reach' | 'height' | 'wingspan';

export function getRanking(field: RankingField, limit = 100): {
  athlete_id: string;
  rank: number;
  name: string;
  avatar_url: string | null;
  position: Position;
  value: number;
  evaluation_date: string;
}[] {
  const db = getDatabase();

  const rows = db.prepare(`
    SELECT e.*, u.avatar_url AS user_avatar_url
    FROM evaluations e
    JOIN users u ON u.id = e.user_id
    WHERE e.user_id IN (
      SELECT p.user_id FROM profiles p WHERE p.show_in_rankings = 1
    )
    AND e.${field} IS NOT NULL
    ORDER BY
      e.user_id,
      e.evaluation_date DESC,
      e.created_at DESC
  `).all() as any[];

  // For each athlete keep only the most recent evaluation that has this metric
  const best = new Map<string, any>();
  for (const r of rows) {
    if (!best.has(r.user_id)) best.set(r.user_id, r);
  }

  const ordered = Array.from(best.entries())
    .map(([, r]) => r)
    .filter(r => (field === 'vertical_jump' ? r.vertical_jump > 0 : r[field] > 0))
    .map(r => ({
      value: field === 'vertical_jump' ? r.vertical_jump : r[field],
      user_id: r.user_id,
      name: r.full_name,
      avatar_url: r.user_avatar_url,
      position: r.position,
      evaluation_date: r.evaluation_date,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return ordered.map((r, i) => ({
    athlete_id: r.user_id,
    rank: i + 1,
    name: r.name,
    avatar_url: r.avatar_url,
    position: r.position,
    value: r.value,
    evaluation_date: r.evaluation_date,
  }));
}

// ----------------- GOALS -----------------
export type GoalInput = {
  title: string;
  description?: string;
  metric_type?: GoalMetricType | null;
  current_value?: number | null;
  target_value?: number | null;
  deadline?: string | null;
};

function computeProgressPct(metricType: string | null, currentValue: number | null, targetValue: number | null): number {
  if (metricType && metricType !== 'tecnica' && currentValue !== null && targetValue !== null && targetValue !== 0) {
    const pct = (currentValue / targetValue) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }
  return 0;
}

export function createGoal(userId: string, input: GoalInput): Goal {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = 'goal_' + crypto.randomBytes(6).toString('hex');

  db.prepare(`
    INSERT INTO goals (id, user_id, title, description, metric_type, current_value, target_value, deadline, status, progress_pct, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?, ?)
  `).run(
    id,
    userId,
    input.title.trim(),
    input.description?.trim() || '',
    input.metric_type ?? null,
    input.current_value ?? null,
    input.target_value ?? null,
    input.deadline ?? null,
    computeProgressPct(input.metric_type ?? null, input.current_value ?? null, input.target_value ?? null),
    now,
    now
  );

  return getGoalById(id, userId)!;
}

export function getGoalById(goalId: string, userId: string): Goal | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(goalId, userId) as any;
  return row ? rowToGoal(row) : null;
}

function rowToGoal(r: any): Goal {
  return {
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    description: r.description,
    metric_type: r.metric_type,
    current_value: r.current_value,
    target_value: r.target_value,
    deadline: r.deadline,
    status: r.status,
    progress_pct: r.progress_pct,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export function getGoalsByUserId(userId: string): Goal[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
  return rows.map(rowToGoal);
}

export function updateGoal(
  goalId: string,
  userId: string,
  data: Partial<GoalInput> & {
    status?: GoalStatus;
    /** Progresso manual apenas para metas técnicas (sem métrica automática). */
    progress_pct?: number;
  }
): Goal | null {
  const db = getDatabase();
  const existing = getGoalById(goalId, userId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const metricType = data.metric_type !== undefined ? data.metric_type : existing.metric_type;
  const currentValue = data.current_value !== undefined ? data.current_value : existing.current_value;
  const targetValue = data.target_value !== undefined ? data.target_value : existing.target_value;
  const status = data.status ?? existing.status;

  // Manual progress for technical goals, computed progress for measurable ones
  const progress = status === 'concluido'
    ? 100
    : (data.progress_pct !== undefined && metricType === 'tecnica'
        ? Math.max(0, Math.min(100, Math.round(data.progress_pct)))
        : computeProgressPct(metricType, currentValue, targetValue));

  db.prepare(`
    UPDATE goals
    SET title = ?,
        description = ?,
        metric_type = ?,
        current_value = ?,
        target_value = ?,
        deadline = ?,
        status = ?,
        progress_pct = ?,
        updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    data.title !== undefined ? data.title.trim() : existing.title,
    data.description !== undefined ? data.description.trim() : existing.description,
    metricType,
    currentValue,
    targetValue,
    data.deadline !== undefined ? data.deadline : existing.deadline,
    status,
    progress,
    now,
    goalId,
    userId
  );

  return getGoalById(goalId, userId);
}

export function deleteGoal(goalId: string, userId: string): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(goalId, userId);
  return result.changes > 0;
}

export function deleteUserAccount(userId: string): boolean {
  const db = getDatabase();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM evaluations WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM goals WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM achievements WHERE user_id = ?').run(userId);
    try {
      db.prepare('DELETE FROM team_members WHERE user_id = ?').run(userId);
    } catch {}
    db.prepare('DELETE FROM profiles WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  tx();
  return true;
}

/**
 * Atualiza os valores atuais de todas as metas mensuráveis de um atleta
 * com base na sua avaliação mais recente. Chamado a cada nova avaliação.
 */
export function syncGoalsWithLatestEvaluation(userId: string): void {
  const db = getDatabase();
  const latest = db.prepare(`
    SELECT * FROM evaluations WHERE user_id = ? ORDER BY evaluation_date DESC, created_at DESC LIMIT 1
  `).get(userId) as any;
  if (!latest) return;

  const metricMap: Record<string, number | null> = {
    attack_reach: latest.attack_reach,
    block_reach: latest.block_reach,
    vertical_jump: latest.vertical_jump,
    reach_jumping: latest.reach_jumping,
    wingspan: latest.wingspan,
    height: latest.height,
    weight: latest.weight,
  };

  const goals = db.prepare(`
    SELECT * FROM goals WHERE user_id = ? AND status = 'ativo' AND metric_type IS NOT NULL AND metric_type != 'tecnica'
  `).all(userId) as any[];

  const now = new Date().toISOString();
  for (const g of goals) {
    const metricValue = metricMap[g.metric_type];
    if (metricValue === null || metricValue === undefined) continue;
    const progress = computeProgressPct(g.metric_type, metricValue, g.target_value);
    db.prepare('UPDATE goals SET current_value = ?, progress_pct = ?, updated_at = ? WHERE id = ?')
      .run(metricValue, progress, now, g.id);
  }
}

// ----------------- ACHIEVEMENTS -----------------
export function getAchievementsByUserId(userId: string): Achievement[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = ?').all(userId) as any[];
  return rows.map(r => ({ key: r.achievement_key as AchievementKey, unlocked_at: r.unlocked_at }));
}

export function unlockAchievements(userId: string, keys: AchievementKey[]): Achievement[] {
  if (keys.length === 0) return [];
  const db = getDatabase();
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO achievements (id, user_id, achievement_key, unlocked_at)
    VALUES (?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    for (const key of keys) {
      insert.run('ach_' + crypto.randomBytes(6).toString('hex'), userId, key, now);
    }
  });
  tx();
  const unlocked = db.prepare(`
    SELECT achievement_key, unlocked_at FROM achievements
    WHERE user_id = ? AND achievement_key IN (${keys.map(() => '?').join(',')})
  `).all(userId, ...keys) as any[];
  return unlocked.map(r => ({ key: r.achievement_key as AchievementKey, unlocked_at: r.unlocked_at }));
}

// ----------------- ATLETE CARD (CARTEIRINHA) -----------------
export function generateCardSlug(name: string): string {
  const base = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'atleta';
  let slug = base;
  let attempt = 0;
  while (isCardSlugTaken(slug, null as unknown as string)) {
    attempt += 1;
    slug = `${base}-${attempt}`;
    if (attempt > 20) {
      slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
      break;
    }
  }
  return slug;
}

function isCardSlugTaken(slug: string, userId?: string): boolean {
  const db = getDatabase();
  const row = db.prepare('SELECT user_id FROM profiles WHERE public_card_slug = ?').get(slug) as any;
  if (!row) return false;
  return userId ? row.user_id !== userId : true;
}

/**
 * Dados exclusivos para o link público da carteirinha: apenas campos
 * que o atleta autorizou (mesmos toggles de privacidade das outras áreas).
 */
export function getPublicCardBySlug(slug: string): AthleteCardData | null {
  const db = getDatabase();
  const profileRow = db.prepare(`
    SELECT p.*, u.name AS account_name, u.avatar_url AS account_avatar
    FROM profiles p JOIN users u ON u.id = p.user_id
    WHERE p.public_card_slug = ? AND p.public_card_enabled = 1
  `).get(slug) as any;
  if (!profileRow) return null;

  const userId = profileRow.user_id;
  const latest = db.prepare(`
    SELECT * FROM evaluations WHERE user_id = ? ORDER BY evaluation_date DESC, created_at DESC LIMIT 1
  `).get(userId) as any;

  const birthDate = profileRow.birth_date || latest?.birth_date || null;
  const age = birthDate ? computeAge(birthDate, latest?.evaluation_date ?? undefined) : null;

  // Birth date is NEVER exposed publicly: only the derived age.
  return {
    id: userId,
    slug,
    name: profileRow.full_name || profileRow.account_name,
    avatar_url: profileRow.account_avatar,
    age,
    position: (latest?.position || profileRow.preferred_position || 'Ponteiro') as Position,
    height: profileRow.show_height ? (latest?.height ?? null) : null,
    wingspan: profileRow.show_wingspan ? (latest?.wingspan ?? null) : null,
    vertical_jump: profileRow.show_reach ? (latest?.vertical_jump ?? null) : null,
    attack_reach: profileRow.show_reach ? (latest?.attack_reach ?? null) : null,
    block_reach: profileRow.show_reach ? (latest?.block_reach ?? null) : null,
    evaluation_date: latest?.evaluation_date ?? null,
    unlocked_achievements: getAchievementsByUserId(userId).slice(0, 4),
  };
}

function computeAge(birthDateStr: string, referenceDateStr?: string): number {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 0;
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

// ----------------- PASSWORD RESETS -----------------
export function createPasswordResetToken(email: string, code: string): void {
  const db = getDatabase();
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 minutes

  db.prepare(`
    INSERT INTO password_resets (id, email, code, expires_at, used)
    VALUES (?, ?, ?, ?, 0)
  `).run(id, email.toLowerCase(), code, expiresAt);
}

export function verifyAndUsePasswordReset(email: string, code: string, newPasswordHash: string): boolean {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    SELECT * FROM password_resets
    WHERE LOWER(email) = LOWER(?) AND code = ? AND used = 0 AND expires_at > ?
    ORDER BY expires_at DESC LIMIT 1
  `);
  const record = stmt.get(email, code, now) as any;
  if (!record) return false;

  const tx = db.transaction(() => {
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(record.id);
    db.prepare('UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)').run(newPasswordHash, email);
  });

  tx();
  return true;
}
