import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { calculateAge, calculateVerticalJump, calculateBMI, getBMICategory, getJumpCategory } from '../src/lib/calculations';
import { createEvaluation, getEvaluationsByUserId, getAllTeamAthletes, updateProfile, createPasswordResetToken, verifyAndUsePasswordReset, deleteEvaluation, createTeam, addUserToTeam } from '../src/lib/db-sqlite';

console.log('=====================================================');
console.log('TESTES DE INTEGRAÇÃO E FUNCIONALIDADE: TIME IFAL');
console.log('=====================================================\n');

const dbPath = path.join(process.cwd(), 'data', 'volleyball.db');
const db = new Database(dbPath);

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  // 1. Database & Initial Seed Verification
  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;
  assert(userCount >= 5, `Banco possui atletas cadastrados no elenco (Total: ${userCount})`);

  const initialAthlete = db.prepare("SELECT * FROM users WHERE email = 'matheus.santos@ifal.edu.br'").get() as any;
  assert(initialAthlete !== undefined, 'Atleta Matheus Santos cadastrado com sucesso');

  const evalCount = (db.prepare('SELECT COUNT(*) as cnt FROM evaluations').get() as any).cnt;
  assert(evalCount >= 0, `Banco de dados acessível e tabela de avaliações pronta (Total atual: ${evalCount})`);

  // 2. Automated Calculations Test
  const testAge = calculateAge('2002-05-14', '2026-11-05');
  assert(testAge === 24, `Cálculo automático de idade: data 2002-05-14 -> ${testAge} anos (esperado: 24)`);

  const testJump = calculateVerticalJump(248, 338);
  assert(testJump === 90, `Cálculo automático de Salto Vertical: 338cm - 248cm -> +${testJump}cm (esperado: 90)`);

  const testBMI = calculateBMI(85, 195);
  assert(testBMI === 22.4, `Cálculo automático de IMC: 85kg / (1.95m)² -> ${testBMI} kg/m² (esperado: 22.4)`);

  const bmiCat = getBMICategory(testBMI);
  assert(bmiCat.label.includes('Peso normal'), `Classificação do IMC correta: ${bmiCat.label}`);

  const jumpCat = getJumpCategory(testJump);
  assert(jumpCat.label.includes('Elite'), `Classificação de salto correta: ${jumpCat.label}`);

  // 3. User Registration & Password Hashing Test
  const testEmail = `atleta.teste.${Date.now()}@ifal.edu.br`;
  const rawPass = 'senhaSegura123';
  const hashed = await bcrypt.hash(rawPass, 10);
  const testUserId = `test-user-${Date.now()}`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(testUserId, testEmail, hashed, 'Carlos Eduardo Teste', null, new Date().toISOString());

  db.prepare(`
    INSERT INTO profiles (user_id, full_name, birth_date, preferred_position, serve_types, bio_goals, show_weight, show_height, show_reach, show_wingspan, show_goals, show_evaluations, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1, 1, ?)
  `).run(testUserId, 'Carlos Eduardo Teste', '2001-08-20', 'Oposto', JSON.stringify(['Viagem', 'Híbrido']), 'Ser titular da equipe', new Date().toISOString());

  const insertedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId) as any;
  assert(insertedUser && insertedUser.email === testEmail, 'Cadastro de novo atleta salvo com sucesso no banco de dados');

  const passValid = await bcrypt.compare(rawPass, insertedUser.password_hash);
  assert(passValid === true, 'Senha criptografada com bcrypt e validada com sucesso');

  // 4. Multi-Date Evaluations & History Accumulation Test
  createEvaluation({
    id: `eval-test-1-${Date.now()}`,
    user_id: testUserId,
    evaluation_date: '2026-01-10',
    full_name: 'Carlos Eduardo Teste',
    birth_date: '2001-08-20',
    age: 24,
    weight: 88.0,
    height: 196,
    reach_standing: 252,
    reach_jumping: 335,
    wingspan: 202,
    seated_height: 97,
    attack_reach: 343,
    block_reach: 333,
    laterality: 'Destro',
    practice_time: '5 anos',
    vertical_jump: 83,
    bmi: 22.9,
    position: 'Oposto',
    serve_types: ['Viagem'],
    goals: 'Melhorar impulsão na ponta',
    notes: 'Avaliação de janeiro'
  });

  createEvaluation({
    id: `eval-test-2-${Date.now()}`,
    user_id: testUserId,
    evaluation_date: '2026-03-15',
    full_name: 'Carlos Eduardo Teste',
    birth_date: '2001-08-20',
    age: 24,
    weight: 89.2,
    height: 196,
    reach_standing: 252,
    reach_jumping: 341,
    wingspan: 202,
    seated_height: 97,
    attack_reach: 349,
    block_reach: 339,
    laterality: 'Destro',
    practice_time: '5 anos',
    vertical_jump: 89,
    bmi: 23.2,
    position: 'Oposto',
    serve_types: ['Viagem', 'Híbrido'],
    goals: 'Atingir 345cm de alcance',
    notes: 'Avaliação de março - ganho de +6cm de impulsão'
  });

  const userEvals = getEvaluationsByUserId(testUserId);
  assert(userEvals.length === 2, `Histórico acumulou múltiplas avaliações sem sobrescrever (Total: ${userEvals.length})`);
  assert(userEvals[1].vertical_jump === 89, `Evolução de salto registrada: de ${userEvals[0].vertical_jump}cm para ${userEvals[1].vertical_jump}cm`);

  // 5. Privacy Settings & Team Area Filtering Test
  const privacyTeam = createTeam('Time Privacidade IFAL', 'Testes', initialAthlete.id);
  addUserToTeam(testUserId, privacyTeam.id, 'atleta');

  // Verify before hiding: other athletes see Carlos's weight
  let squadViewedByMatheus = getAllTeamAthletes(initialAthlete.id);
  let carlosInSquad = squadViewedByMatheus.find(a => a.id === testUserId);
  assert(carlosInSquad?.weight === 89.2, `Com privacidade pública, peso está visível: ${carlosInSquad?.weight}kg`);

  // Now Carlos turns off weight and goals visibility
  updateProfile(testUserId, {
    show_weight: false,
    show_goals: false
  });

  // Query squad again as Matheus (peer)
  squadViewedByMatheus = getAllTeamAthletes(initialAthlete.id);
  carlosInSquad = squadViewedByMatheus.find(a => a.id === testUserId);
  assert(carlosInSquad?.weight === null, 'Com show_weight=false, peso fica oculto (null/Privado) para companheiros');
  assert(carlosInSquad?.goals === null, 'Com show_goals=false, objetivos ficam ocultos (null/Privado) para companheiros');

  // Query squad as Carlos himself (self)
  const squadViewedByCarlos = getAllTeamAthletes(testUserId);
  const carlosViewSelf = squadViewedByCarlos.find(a => a.id === testUserId);
  assert(carlosViewSelf?.weight === 89.2, `O próprio atleta continua visualizando seus próprios dados privados: ${carlosViewSelf?.weight}kg`);

  // 6. Password Recovery Workflow Test
  const code = '654321';
  createPasswordResetToken(testEmail, code);

  const resetRecord = db.prepare("SELECT * FROM password_resets WHERE email = ? AND code = ?").get(testEmail, code);
  assert(resetRecord !== undefined, 'Código de redefinição de senha gerado e persistido');

  const newPassHash = await bcrypt.hash('novaSenhaIFAL456', 10);
  const resetSuccess = verifyAndUsePasswordReset(testEmail, code, newPassHash);
  assert(resetSuccess === true, 'Senha redefinida com sucesso utilizando código de 6 dígitos');

  const updatedUser = db.prepare("SELECT * FROM users WHERE email = ?").get(testEmail) as any;
  const newPassValid = await bcrypt.compare('novaSenhaIFAL456', updatedUser.password_hash);
  assert(newPassValid === true, 'Nova senha validada com sucesso após redefinição');

  // 7. Evaluation Deletion Test
  const evalToDelete = userEvals[0].id;
  
  // Try deleting using wrong user id (security check)
  const unauthorizedDelete = deleteEvaluation(evalToDelete, 'wrong-user-id');
  assert(unauthorizedDelete === false, 'Tentativa de exclusão não autorizada bloqueada com sucesso');

  // Delete using owner user id
  const ownerDelete = deleteEvaluation(evalToDelete, testUserId);
  assert(ownerDelete === true, 'Exclusão pelo próprio proprietário confirmada com sucesso');

  const remainingEvals = getEvaluationsByUserId(testUserId);
  assert(remainingEvals.length === 1, `Histórico atualizado após exclusão (Restante: ${remainingEvals.length})`);

  console.log('\n=====================================================');
  console.log(`RESULTADO DOS TESTES: ${passCount} PASSOU, ${failCount} FALHOU`);
  console.log('=====================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
