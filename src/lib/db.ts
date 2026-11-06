import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Evaluation, Position, Profile, ServeType, TeamAthlete, User } from './types';

// Ensure data directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'volleyball.db');

// Singleton database instance
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);
  }
  return dbInstance;
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

    CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(evaluation_date);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
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
  return (stmt.get(id) as any) || null;
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
      user_id, full_name, birth_date, preferred_position, serve_types, bio_goals,
      show_weight, show_height, show_reach, show_wingspan, show_goals, show_evaluations, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1, ?)
  `);

  const runTx = db.transaction(() => {
    insertUser.run(user.id, user.email.toLowerCase(), user.password_hash, user.name, user.avatar_url || null, now);
    insertProfile.run(
      user.id,
      user.name,
      null,
      'Ponteiro',
      JSON.stringify(['Flutuante pulando']),
      '',
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

// ----------------- PROFILE HELPERS -----------------
export function getProfileByUserId(userId: string): Profile | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM profiles WHERE user_id = ?');
  const row = stmt.get(userId) as any;
  if (!row) return null;

  return {
    user_id: row.user_id,
    full_name: row.full_name,
    birth_date: row.birth_date,
    preferred_position: row.preferred_position as Position,
    serve_types: JSON.parse(row.serve_types || '[]'),
    bio_goals: row.bio_goals,
    show_weight: Boolean(row.show_weight),
    show_height: Boolean(row.show_height),
    show_reach: Boolean(row.show_reach),
    show_wingspan: Boolean(row.show_wingspan),
    show_goals: Boolean(row.show_goals),
    show_evaluations: Boolean(row.show_evaluations),
    updated_at: row.updated_at
  };
}

export function updateProfile(userId: string, data: Partial<Profile> & { name?: string; avatar_url?: string }): Profile {
  const db = getDatabase();
  const now = new Date().toISOString();

  const current = getProfileByUserId(userId);
  if (!current) {
    throw new Error('Profile not found');
  }

  const tx = db.transaction(() => {
    if (data.name !== undefined || data.avatar_url !== undefined) {
      db.prepare(`
        UPDATE users 
        SET name = COALESCE(?, name),
            avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `).run(data.name || null, data.avatar_url || null, userId);
    }

    const updated = {
      full_name: data.full_name ?? (data.name ?? current.full_name),
      birth_date: data.birth_date !== undefined ? data.birth_date : current.birth_date,
      preferred_position: data.preferred_position ?? current.preferred_position,
      serve_types: data.serve_types ? JSON.stringify(data.serve_types) : JSON.stringify(current.serve_types),
      bio_goals: data.bio_goals !== undefined ? data.bio_goals : current.bio_goals,
      show_weight: data.show_weight !== undefined ? (data.show_weight ? 1 : 0) : (current.show_weight ? 1 : 0),
      show_height: data.show_height !== undefined ? (data.show_height ? 1 : 0) : (current.show_height ? 1 : 0),
      show_reach: data.show_reach !== undefined ? (data.show_reach ? 1 : 0) : (current.show_reach ? 1 : 0),
      show_wingspan: data.show_wingspan !== undefined ? (data.show_wingspan ? 1 : 0) : (current.show_wingspan ? 1 : 0),
      show_goals: data.show_goals !== undefined ? (data.show_goals ? 1 : 0) : (current.show_goals ? 1 : 0),
      show_evaluations: data.show_evaluations !== undefined ? (data.show_evaluations ? 1 : 0) : (current.show_evaluations ? 1 : 0),
    };

    db.prepare(`
      UPDATE profiles
      SET full_name = ?,
          birth_date = ?,
          preferred_position = ?,
          serve_types = ?,
          bio_goals = ?,
          show_weight = ?,
          show_height = ?,
          show_reach = ?,
          show_wingspan = ?,
          show_goals = ?,
          show_evaluations = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(
      updated.full_name,
      updated.birth_date,
      updated.preferred_position,
      updated.serve_types,
      updated.bio_goals,
      updated.show_weight,
      updated.show_height,
      updated.show_reach,
      updated.show_wingspan,
      updated.show_goals,
      updated.show_evaluations,
      now,
      userId
    );
  });

  tx();
  return getProfileByUserId(userId)!;
}

// ----------------- EVALUATION HELPERS -----------------
export function createEvaluation(evalData: Omit<Evaluation, 'created_at'>): Evaluation {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO evaluations (
      id, user_id, evaluation_date, full_name, birth_date, age,
      weight, height, reach_standing, reach_jumping, wingspan,
      vertical_jump, bmi, position, serve_types, goals, notes, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
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
    evalData.vertical_jump,
    evalData.bmi,
    evalData.position,
    JSON.stringify(evalData.serve_types),
    evalData.goals,
    evalData.notes || '',
    now
  );

  // Sync profile metadata
  try {
    db.prepare(`
      UPDATE profiles
      SET full_name = ?,
          birth_date = ?,
          preferred_position = ?,
          serve_types = ?,
          bio_goals = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(
      evalData.full_name,
      evalData.birth_date,
      evalData.position,
      JSON.stringify(evalData.serve_types),
      evalData.goals,
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

  return rows.map(r => ({
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
    vertical_jump: r.vertical_jump,
    bmi: r.bmi,
    position: r.position as Position,
    serve_types: JSON.parse(r.serve_types || '[]'),
    goals: r.goals,
    notes: r.notes,
    created_at: r.created_at
  }));
}

export function getEvaluationById(id: string, userId?: string): Evaluation | null {
  const db = getDatabase();
  let stmt;
  let row;
  if (userId) {
    stmt = db.prepare('SELECT * FROM evaluations WHERE id = ? AND user_id = ?');
    row = stmt.get(id, userId) as any;
  } else {
    stmt = db.prepare('SELECT * FROM evaluations WHERE id = ?');
    row = stmt.get(id) as any;
  }

  if (!row) return null;
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
    vertical_jump: row.vertical_jump,
    bmi: row.bmi,
    position: row.position as Position,
    serve_types: JSON.parse(row.serve_types || '[]'),
    goals: row.goals,
    notes: row.notes,
    created_at: row.created_at
  };
}

export function deleteEvaluation(id: string, userId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM evaluations WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// ----------------- TEAM HELPERS WITH PRIVACY -----------------
export function getAllTeamAthletes(requestingUserId?: string): TeamAthlete[] {
  const db = getDatabase();

  const query = `
    SELECT 
      u.id,
      u.name,
      u.avatar_url,
      p.full_name,
      p.birth_date,
      p.preferred_position,
      p.serve_types,
      p.bio_goals,
      p.show_weight,
      p.show_height,
      p.show_reach,
      p.show_wingspan,
      p.show_goals,
      p.show_evaluations,
      p.updated_at
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    ORDER BY u.name ASC
  `;

  const rows = db.prepare(query).all() as any[];

  return rows.map(row => {
    const isSelf = requestingUserId === row.id;
    const showWeight = isSelf || Boolean(row.show_weight);
    const showHeight = isSelf || Boolean(row.show_height);
    const showReach = isSelf || Boolean(row.show_reach);
    const showWingspan = isSelf || Boolean(row.show_wingspan);
    const showGoals = isSelf || Boolean(row.show_goals);
    const showEvaluations = isSelf || Boolean(row.show_evaluations);

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

    return {
      id: row.id,
      name: row.full_name || row.name,
      avatar_url: row.avatar_url,
      position: (latestEval?.position || row.preferred_position || 'Ponteiro') as Position,
      birth_date: row.birth_date || latestEval?.birth_date || null,
      age: latestEval?.age ?? null,
      height: showHeight ? (latestEval?.height ?? null) : null,
      weight: showWeight ? (latestEval?.weight ?? null) : null,
      reach_standing: showReach ? (latestEval?.reach_standing ?? null) : null,
      reach_jumping: showReach ? (latestEval?.reach_jumping ?? null) : null,
      wingspan: showWingspan ? (latestEval?.wingspan ?? null) : null,
      vertical_jump: showReach ? (latestEval?.vertical_jump ?? null) : null,
      bmi: (showWeight && showHeight) ? (latestEval?.bmi ?? null) : null,
      serve_types: serveTypes,
      goals: showGoals ? (latestEval?.goals || row.bio_goals || null) : null,
      last_updated: latestEval?.evaluation_date || row.updated_at || null,
      evaluations_count: showEvaluations ? evalCount : 0,
      privacy: {
        show_weight: Boolean(row.show_weight),
        show_height: Boolean(row.show_height),
        show_reach: Boolean(row.show_reach),
        show_wingspan: Boolean(row.show_wingspan),
        show_goals: Boolean(row.show_goals),
        show_evaluations: Boolean(row.show_evaluations)
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
