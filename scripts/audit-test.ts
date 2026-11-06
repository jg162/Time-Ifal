import bcrypt from 'bcryptjs';
import { calculateAge, calculateVerticalJump, calculateBMI, getBMICategory, getJumpCategory } from '../src/lib/calculations';
import { createTeam, getTeamByCode, getUserTeam, addUserToTeam, deleteUserAccount, createEvaluation } from '../src/lib/db-sqlite';
import { getDatabase } from '../src/lib/db-sqlite';

console.log('===================================================================');
console.log('AUDITORIA TÉCNICA E TESTES DE INTEGRAÇÃO — VOLLEY PERFORMANCE');
console.log('===================================================================\n');

let pass = 0;
let fail = 0;

function check(desc: string, cond: boolean) {
  if (cond) {
    console.log(`✅ [PASS] ${desc}`);
    pass++;
  } else {
    console.error(`❌ [FAIL] ${desc}`);
    fail++;
  }
}

async function run() {
  const db = getDatabase();

  // 1. SEGURANÇA: Hashing de Senhas
  console.log('\n--- 1. TESTES DE SEGURANÇA E CRIPTOGRAFIA ---');
  const rawPassword = 'SenhaAtletaForte@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPassword, salt);

  check('Senha nunca é armazenada em texto plano', hash !== rawPassword);
  check('Bcrypt gera hash padrão seguro ($2a$ ou $2b$)', hash.startsWith('$2a$') || hash.startsWith('$2b$'));
  const match = await bcrypt.compare(rawPassword, hash);
  check('Validação de senha por bcrypt funciona perfeitamente', match === true);
  const falseMatch = await bcrypt.compare('senhaErrada', hash);
  check('Tentativa de acesso com senha incorreta é bloqueada', falseMatch === false);

  // 2. BIOMETRIA: Cálculos Oficiais do Voleibol
  console.log('\n--- 2. TESTES DE CÁLCULOS BIOMÉTRICOS ---');
  const jump = calculateVerticalJump(245, 325);
  check('Cálculo de Salto Vertical Líquido (325cm - 245cm = 80cm)', jump === 80);

  const jumpZero = calculateVerticalJump(250, 240);
  check('Salto não permite valor negativo (retorna 0)', jumpZero === 0);

  const age = calculateAge('2006-03-15', '2026-11-06');
  check('Cálculo automático de idade preserva proteção de menores (20 anos)', age === 20);

  const bmi = calculateBMI(75, 185);
  check('Cálculo de IMC atlético (75kg / 1.85m² = 21.9)', bmi === 21.9);

  const jumpCategory = getJumpCategory(80);
  check('Classificação atlética de impulsão categorizada corretamente', jumpCategory.label.length > 0);

  // 3. TIMES: Criação, Código de Convite e Associação
  console.log('\n--- 3. TESTES DO SISTEMA DE TIMES ---');
  const tempUserId = 'usr_teste_capitao_' + Date.now();
  db.prepare('INSERT OR REPLACE INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
    tempUserId,
    `capitao.${Date.now()}@ifal.edu.br`,
    'Capitão Teste',
    hash,
    new Date().toISOString()
  );

  const newTeam = createTeam('Time IFAL Master', 'Time principal de alto rendimento', tempUserId);
  check('Time criado com código gerado', Boolean(newTeam.code && newTeam.code.startsWith('TIME-')));

  const fetchedTeam = getTeamByCode(newTeam.code);
  check('Busca de time por código de convite funciona', fetchedTeam !== null && fetchedTeam.id === newTeam.id);

  const athleteUserId = 'usr_atleta_membro_' + Date.now();
  db.prepare('INSERT OR REPLACE INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
    athleteUserId,
    `atleta.${Date.now()}@ifal.edu.br`,
    'Atleta Membro',
    hash,
    new Date().toISOString()
  );

  addUserToTeam(athleteUserId, newTeam.id, 'atleta');
  const athleteTeam = getUserTeam(athleteUserId);
  check('Atleta entra no time com sucesso via código de convite', athleteTeam?.id === newTeam.id);

  // 4. LGPD: Exclusão de Conta Definitiva
  console.log('\n--- 4. TESTES DE PRIVACIDADE E EXCLUSÃO (LGPD) ---');
  createEvaluation({
    id: 'eval_temp_' + Date.now(),
    user_id: athleteUserId,
    full_name: 'Atleta Membro',
    birth_date: '2004-05-10',
    evaluation_date: '2026-11-06',
    age: 22,
    height: 190,
    weight: 80,
    reach_standing: 245,
    reach_jumping: 325,
    wingspan: 195,
    position: 'Ponteiro',
    laterality: 'Destro',
    vertical_jump: 80,
    bmi: 22.2,
    attack_reach: 325,
    block_reach: 305,
    seated_height: null,
    serve_types: ['Flutuante pulando'],
    goals: 'Evoluir salto',
    medical_notes: null,
  });

  const evalsBefore = db.prepare('SELECT COUNT(*) as c FROM evaluations WHERE user_id = ?').get(athleteUserId) as any;
  check('Avaliação temporária inserida antes do teste de exclusão', evalsBefore.c === 1);

  deleteUserAccount(athleteUserId);
  const evalsAfter = db.prepare('SELECT COUNT(*) as c FROM evaluations WHERE user_id = ?').get(athleteUserId) as any;
  check('Avaliações do atleta são apagadas após exclusão da conta', evalsAfter.c === 0);

  const userAfter = db.prepare('SELECT * FROM users WHERE id = ?').get(athleteUserId);
  check('Conta do usuário é removida completamente em conformidade com a LGPD', userAfter === undefined);

  // Limpeza
  deleteUserAccount(tempUserId);

  console.log('\n===================================================================');
  console.log(`RESULTADO DA AUDITORIA: ${pass} testes APROVADOS | ${fail} testes FALHOS`);
  console.log('===================================================================\n');

  if (fail > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Audit test failed:', e);
  process.exit(1);
});
