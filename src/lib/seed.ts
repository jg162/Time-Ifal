import bcrypt from 'bcryptjs';
import { calculateAllMetrics } from './calculations';
import { ensureSeedData as ensureSeedDataDb } from './db';
import { useSupabase } from './db';

const initialAthletes = [
  {
    id: 'athlete-matheus-santos',
    name: 'Matheus Santos',
    email: 'matheus.santos@ifal.edu.br',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    position: 'Ponteiro',
    birth_date: '2004-05-14',
    laterality: 'Destro',
    practice_time: '5 anos',
    serve_types: ['Viagem', 'Flutuante pulando'],
    bio_goals: 'Evoluir consistência no ataque de ponta contra bloqueio duplo e aprimorar a potência do saque viagem nos momentos decisivos.',
    evaluations: [
      { date: '2025-08-10', weight: 84.5, height: 194, standingReach: 248, jumpingReach: 330, wingspan: 199, seatedHeight: 100, attackReach: 338, blockReach: 335, goals: 'Aumentar impulsão vertical em 5cm e manter porcentagem de acerto no ataque acima de 55%.', laterality: 'Destro', practice_time: '5 anos' },
      { date: '2025-11-20', weight: 85.2, height: 194, standingReach: 248, jumpingReach: 336, wingspan: 199, seatedHeight: 100, attackReach: 344, blockReach: 340, goals: 'Foco na aceleração de passada no salto e velocidade de braço.', laterality: 'Destro', practice_time: '5 anos' },
      { date: '2026-02-15', weight: 86.0, height: 195, standingReach: 249, jumpingReach: 342, wingspan: 200, seatedHeight: 101, attackReach: 350, blockReach: 346, goals: 'Alcançar 345cm de alcance no ataque e consolidar recepção na linha de passe.', laterality: 'Destro', practice_time: '5 anos' },
    ],
  },
  {
    id: 'athlete-gabriel-silva',
    name: 'Gabriel Silva',
    email: 'gabriel.silva@ifal.edu.br',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    position: 'Central',
    birth_date: '2003-09-22',
    laterality: 'Destro',
    practice_time: '7 anos',
    serve_types: ['Flutuante pulando', 'Flutuante parado'],
    bio_goals: 'Dominar leitura rápida de levantadores adversários, velocidade de deslocamento lateral e fechamento de bloqueio triplo.',
    evaluations: [
      { date: '2025-09-05', weight: 92.0, height: 201, standingReach: 260, jumpingReach: 345, wingspan: 208, seatedHeight: 104, attackReach: 353, blockReach: 350, goals: 'Melhorar velocidade de passada para bloqueio nas extremidades.', laterality: 'Destro', practice_time: '7 anos' },
      { date: '2026-01-18', weight: 93.5, height: 202, standingReach: 261, jumpingReach: 352, wingspan: 209, seatedHeight: 105, attackReach: 362, blockReach: 357, goals: 'Atingir 355cm de alcance no bloqueio e potência no primeiro tempo com o levantador.', laterality: 'Destro', practice_time: '7 anos' },
    ],
  },
  {
    id: 'athlete-lucas-oliveira',
    name: 'Lucas Oliveira',
    email: 'lucas.oliveira@ifal.edu.br',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    position: 'Levantador',
    birth_date: '2005-02-10',
    laterality: 'Destro',
    practice_time: '3 anos',
    serve_types: ['Flutuante pulando', 'Híbrido'],
    bio_goals: 'Precisão milimétrica nas bolas aceleradas de ponta e pipe, além de leitura tática de bloqueio adversário.',
    evaluations: [
      { date: '2025-08-15', weight: 76.0, height: 185, standingReach: 236, jumpingReach: 312, wingspan: 188, seatedHeight: 96, attackReach: 320, blockReach: 316, goals: 'Aprimorar impulsão no salto para levantamento em suspensão.', laterality: 'Destro', practice_time: '3 anos' },
      { date: '2026-02-01', weight: 77.4, height: 186, standingReach: 237, jumpingReach: 318, wingspan: 189, seatedHeight: 97, attackReach: 326, blockReach: 322, goals: 'Consolidar precisão nas bolas rápidas de meio e defesa na diagonal.', laterality: 'Destro', practice_time: '3 anos' },
    ],
  },
  {
    id: 'athlete-rafael-costa',
    name: 'Rafael Costa',
    email: 'rafael.costa@ifal.edu.br',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    position: 'Líbero',
    birth_date: '2004-11-03',
    laterality: 'Canhoto',
    practice_time: '6 anos',
    serve_types: ['Saque por cima', 'Flutuante parado'],
    bio_goals: 'Liderar a comunicação da linha defensiva, cobrir bloqueio e manter passe A acima de 70% nas partidas.',
    evaluations: [
      { date: '2025-09-12', weight: 68.5, height: 174, standingReach: 224, jumpingReach: 295, wingspan: 176, seatedHeight: 91, attackReach: 305, blockReach: 300, goals: 'Agilidade lateral, tempo de reação e controle de manchete.', laterality: 'Destro', practice_time: '6 anos' },
      { date: '2026-02-10', weight: 69.2, height: 175, standingReach: 225, jumpingReach: 302, wingspan: 177, seatedHeight: 92, attackReach: 312, blockReach: 306, goals: 'Reforçar estabilidade no passe de saques viagem potentes.', laterality: 'Destro', practice_time: '6 anos' },
    ],
  },
  {
    id: 'athlete-thiago-almeida',
    name: 'Thiago Almeida',
    email: 'thiago.almeida@ifal.edu.br',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    position: 'Oposto',
    birth_date: '2003-07-19',
    laterality: 'Destro',
    practice_time: '8 anos',
    serve_types: ['Viagem', 'Híbrido'],
    bio_goals: 'Ser a referência na saída de rede nos momentos de bola alta, potência no saque viagem acima de 100km/h.',
    evaluations: [
      { date: '2025-08-25', weight: 90.0, height: 198, standingReach: 254, jumpingReach: 338, wingspan: 204, seatedHeight: 103, attackReach: 347, blockReach: 343, goals: 'Ganho de potência no salto e resistência física para jogos de 5 sets.', laterality: 'Destro', practice_time: '8 anos' },
      { date: '2026-02-22', weight: 91.5, height: 198, standingReach: 254, jumpingReach: 348, wingspan: 205, seatedHeight: 103, attackReach: 356, blockReach: 352, goals: 'Superar os 350cm de alcance e calibrar diagonal curta na saída.', laterality: 'Destro', practice_time: '8 anos' },
    ],
  },
];

async function seedSqlite() {
  const { getDatabase } = await import('./db-sqlite');
  const db = getDatabase();
  const now = new Date().toISOString();
  const defaultPasswordHash = bcrypt.hashSync('ifal1234', 10);

  const insertUserStmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertProfileStmt = db.prepare(`
    INSERT OR IGNORE INTO profiles (
      user_id, full_name, birth_date, preferred_position, laterality, serve_types, bio_goals, practice_time,
      show_weight, show_height, show_reach, show_wingspan, show_goals, show_evaluations,
      show_in_rankings, public_card_enabled, public_card_slug, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1, 1, 0, ?, ?)
  `);
  const insertEvalStmt = db.prepare(`
    INSERT OR IGNORE INTO evaluations (
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

  const tx = db.transaction(() => {
    for (const a of initialAthletes) {
      const slug = a.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'atleta';
      insertUserStmt.run(a.id, a.email.toLowerCase(), defaultPasswordHash, a.name, a.avatar_url, now);
      insertProfileStmt.run(
        a.id, a.name, a.birth_date, a.position, a.laterality,
        JSON.stringify([...a.serve_types]), a.bio_goals, a.practice_time, slug, now
      );
      for (let i = 0; i < a.evaluations.length; i++) {
        const ev = a.evaluations[i];
        const metrics = calculateAllMetrics(
          a.birth_date, ev.weight, ev.height, ev.standingReach, ev.jumpingReach, ev.date, ev.attackReach, ev.blockReach
        );
        insertEvalStmt.run(
          `eval-${a.id}-${i + 1}`, a.id, ev.date, a.name, a.birth_date, metrics.age,
          ev.weight, ev.height, ev.standingReach, ev.jumpingReach, ev.wingspan,
          ev.seatedHeight, ev.attackReach, ev.blockReach, a.laterality, a.practice_time,
          metrics.vertical_jump, metrics.bmi, a.position,
          JSON.stringify([...a.serve_types]), ev.goals,
          'Avaliação periódica de desempenho esportivo.', now
        );
      }
    }
  });
  try { tx(); } catch { /* ignore concurrent */ }
}

export async function ensureSeedData() {
  if (useSupabase()) {
    return ensureSeedDataDb();
  }
  await seedSqlite();
}
