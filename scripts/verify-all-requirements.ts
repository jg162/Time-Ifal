import { NextRequest } from 'next/server';
import { POST as registerRoute } from '../src/app/api/auth/register/route';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { POST as logoutRoute } from '../src/app/api/auth/logout/route';
import { POST as recoverRoute } from '../src/app/api/auth/recover/route';
import { POST as resetRoute } from '../src/app/api/auth/reset/route';
import { GET as profileGetRoute, PUT as profilePutRoute } from '../src/app/api/profile/route';
import { GET as evalGetRoute, POST as evalPostRoute } from '../src/app/api/evaluations/route';
import { DELETE as evalDeleteRoute } from '../src/app/api/evaluations/[id]/route';
import { GET as teamGetRoute, POST as teamPostRoute } from '../src/app/api/teams/route';
import { GET as teamAthletesGetRoute } from '../src/app/api/team/route';
import { POST as joinTeamRoute } from '../src/app/api/teams/join/route';
import { POST as leaveTeamRoute } from '../src/app/api/teams/leave/route';
import { getDatabase } from '../src/lib/db-sqlite';

interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function record(category: string, name: string, ok: boolean, details: string) {
  const status = ok ? 'PASS' : 'FAIL';
  results.push({ name, category, status, details });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [${category}] ${name} -> ${details}`);
}

function makeRequest(url: string, method: string, body?: any, cookieToken?: string): NextRequest {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (cookieToken) {
    headers.set('Cookie', `volley_performance_token=${cookieToken}`);
  }
  const init: RequestInit = {
    method,
    headers,
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as any);
}

function extractToken(res: Response): string | undefined {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return undefined;
  const match = setCookie.match(/volley_performance_token=([^;]+)/);
  return match ? match[1] : undefined;
}

async function runE2E() {
  console.log('===================================================================');
  console.log('INICIANDO AUDITORIA E TESTES E2E REAIS — TIME IFAL');
  console.log('===================================================================\n');

  const ts = Date.now();
  const emailUser1 = `capitao.ifal.${ts}@aluno.ifal.edu.br`;
  const emailUser2 = `atleta.ifal.${ts}@aluno.ifal.edu.br`;
  const password = 'SenhaForteIFAL@2026';

  let tokenUser1: string = '';
  let tokenUser2: string = '';
  let idUser1: string = '';
  let idUser2: string = '';
  let teamCode: string = '';
  let eval1Id: string = '';

  // ---------------------------------------------------------
  // 1. CADASTRO (CONTA 1 E CONTA 2)
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 1: CADASTRO DE CONTAS ---');
  
  // Teste negativo: cadastro incompleto
  const badRegReq = makeRequest('/api/auth/register', 'POST', { name: '', email: 'invalido', password: '123' });
  const badRegRes = await registerRoute(badRegReq);
  const badRegData = await badRegRes.json();
  record('Cadastro', 'Validação de campos obrigatórios', badRegRes.status === 400, `Rejeitado com status 400: ${badRegData.error}`);

  // Cadastro Conta 1 (Capitão)
  const reg1Req = makeRequest('/api/auth/register', 'POST', {
    name: 'Lucas Capitão IFAL',
    email: emailUser1,
    password,
    confirmPassword: password,
  });
  const reg1Res = await registerRoute(reg1Req);
  const reg1Data = await reg1Res.json();
  tokenUser1 = extractToken(reg1Res) || '';
  idUser1 = reg1Data.user?.id || '';
  record('Cadastro', 'Criar Conta 1 (Capitão)', reg1Res.status === 200 && Boolean(idUser1), `ID: ${idUser1}, Token recebido: ${Boolean(tokenUser1)}`);

  // Cadastro Conta 2 (Atleta)
  const reg2Req = makeRequest('/api/auth/register', 'POST', {
    name: 'Gabriel Ponteiro IFAL',
    email: emailUser2,
    password,
    confirmPassword: password,
  });
  const reg2Res = await registerRoute(reg2Req);
  const reg2Data = await reg2Res.json();
  tokenUser2 = extractToken(reg2Res) || '';
  idUser2 = reg2Data.user?.id || '';
  record('Cadastro', 'Criar Conta 2 (Atleta Membro)', reg2Res.status === 200 && Boolean(idUser2), `ID: ${idUser2}, Token recebido: ${Boolean(tokenUser2)}`);

  // Teste duplicado: mesmo email
  const dupRegReq = makeRequest('/api/auth/register', 'POST', {
    name: 'Clone',
    email: emailUser1,
    password,
    confirmPassword: password,
  });
  const dupRegRes = await registerRoute(dupRegReq);
  record('Cadastro', 'Impedir e-mails duplicados', dupRegRes.status === 409, `Bloqueado com status 409`);

  // ---------------------------------------------------------
  // 2. LOGIN E LOGOUT
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 2: LOGIN E LOGOUT ---');
  // Login incorreto
  const badLoginReq = makeRequest('/api/auth/login', 'POST', { email: emailUser1, password: 'senhaErrada123' });
  const badLoginRes = await loginRoute(badLoginReq);
  record('Login', 'Bloqueio de credenciais incorretas', badLoginRes.status === 401, 'Status 401');

  // Login Conta 1 correto
  const login1Req = makeRequest('/api/auth/login', 'POST', { email: emailUser1, password });
  const login1Res = await loginRoute(login1Req);
  const login1Data = await login1Res.json();
  tokenUser1 = extractToken(login1Res) || tokenUser1;
  record('Login', 'Login Conta 1 com sucesso', login1Res.status === 200 && login1Data.user?.email === emailUser1, `Usuário autenticado: ${login1Data.user?.name}`);

  // Logout
  const logoutReq = makeRequest('/api/auth/logout', 'POST');
  const logoutRes = await logoutRoute();
  const setCookieLogout = logoutRes.headers.get('set-cookie') || '';
  record('Logout', 'Encerrar sessão e limpar cookie', setCookieLogout.includes('Max-Age=0') || setCookieLogout.includes('expires'), 'Cookie expirado com sucesso');

  // ---------------------------------------------------------
  // 3. RECUPERAÇÃO DE SENHA
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 3: RECUPERAÇÃO DE SENHA ---');
  const recoverReq = makeRequest('/api/auth/recover', 'POST', { email: emailUser1 });
  const recoverRes = await recoverRoute(recoverReq);
  const recoverData = await recoverRes.json();
  record('Recuperação de Senha', 'Solicitar código de 6 dígitos', recoverRes.status === 200, `Resposta: ${recoverData.message}`);

  // Verificar código no banco
  const db = getDatabase();
  const resetRecord = db.prepare('SELECT code FROM password_resets WHERE email = ? ORDER BY expires_at DESC LIMIT 1').get(emailUser1) as any;
  const resetCode = resetRecord?.code;
  record('Recuperação de Senha', 'Código gerado no banco', Boolean(resetCode && resetCode.length === 6), `Código: ${resetCode}`);

  if (resetCode) {
    const newPass = 'NovaSenhaIFAL@2026';
    const resetReq = makeRequest('/api/auth/reset', 'POST', {
      email: emailUser1,
      code: resetCode,
      newPassword: newPass,
      confirmPassword: newPass,
    });
    const resetRes = await resetRoute(resetReq);
    record('Recuperação de Senha', 'Redefinição de senha com código', resetRes.status === 200, 'Senha alterada com sucesso');

    // Relogar com nova senha para renovar o token
    const reLogin = await loginRoute(makeRequest('/api/auth/login', 'POST', { email: emailUser1, password: newPass }));
    tokenUser1 = extractToken(reLogin) || tokenUser1;
  }

  // ---------------------------------------------------------
  // 4. MEU PERFIL (VISUALIZAR, EDITAR, SALVAR, PERSISTÊNCIA)
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 4: MEU PERFIL ---');
  const profileUpdateReq = makeRequest('/api/profile', 'PUT', {
    full_name: 'Lucas Silva Capitão IFAL',
    birth_date: '2004-03-15',
    preferred_position: 'Ponteiro',
    serve_types: ['Viagem', 'Flutuante'],
    bio_goals: 'Liderar o IFAL no JIFAL e melhorar impulsão',
    height: 194,
    weight: 84.5,
    wingspan: 201,
  }, tokenUser1);

  const profileUpdateRes = await profilePutRoute(profileUpdateReq);
  const profileUpdateData = await profileUpdateRes.json();
  record('Meu Perfil', 'Editar e salvar dados (com altura, peso, envergadura)', profileUpdateRes.status === 200, `Nome: ${profileUpdateData.profile?.full_name}, Altura: ${profileUpdateData.profile?.height}cm`);

  // Consulta do perfil atualizado (simulando reload da página)
  const profileGetReq = makeRequest('/api/profile', 'GET', undefined, tokenUser1);
  const profileGetRes = await profileGetRoute(profileGetReq);
  const profileGetData = await profileGetRes.json();
  const prof = profileGetData.profile;
  const profilePersisted = prof && prof.full_name === 'Lucas Silva Capitão IFAL' && prof.height === 194 && prof.weight === 84.5 && prof.wingspan === 201;
  record('Meu Perfil', 'Persistência dos dados após recarregamento', profilePersisted, `Altura: ${prof?.height}cm, Peso: ${prof?.weight}kg, Envergadura: ${prof?.wingspan}cm`);

  // ---------------------------------------------------------
  // 5. AVALIAÇÕES FÍSICAS E CÁLCULO DE SALTO VERTICAL
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 5: AVALIAÇÕES FÍSICAS E CÁLCULO ---');
  // Medidas: parado = 245cm, salto = 330cm -> salto vertical = 85cm
  const eval1Req = makeRequest('/api/evaluations', 'POST', {
    evaluation_date: '2026-05-10',
    full_name: 'Lucas Silva Capitão IFAL',
    birth_date: '2004-03-15',
    weight: 84.5,
    height: 194,
    reach_standing: 245,
    reach_jumping: 330,
    wingspan: 201,
    attack_reach: 338,
    block_reach: 322,
    position: 'Ponteiro',
    laterality: 'Destro',
    serve_types: ['Viagem'],
    goals: 'Aumentar alcance de ataque para 340cm',
    notes: 'Primeira avaliação oficial do semestre',
  }, tokenUser1);

  const eval1Res = await evalPostRoute(eval1Req);
  const eval1Data = await eval1Res.json();
  eval1Id = eval1Data.evaluation?.id || '';
  const verticalJumpCalc = eval1Data.evaluation?.vertical_jump;
  record('Avaliações', 'Registrar avaliação física com todas as medidas', eval1Res.status === 200 && Boolean(eval1Id), `ID: ${eval1Id}`);
  record('Avaliações', 'Cálculo automático de Salto Vertical (330 - 245 = 85cm)', verticalJumpCalc === 85, `Salto calculado: ${verticalJumpCalc}cm`);

  // Validação: alcance pulando < parado deve dar erro
  const badEvalReq = makeRequest('/api/evaluations', 'POST', {
    evaluation_date: '2026-05-11',
    full_name: 'Lucas Silva Capitão IFAL',
    birth_date: '2004-03-15',
    weight: 84.5,
    height: 194,
    reach_standing: 250,
    reach_jumping: 240, // menor que parado!
    wingspan: 201,
    position: 'Ponteiro',
  }, tokenUser1);
  const badEvalRes = await evalPostRoute(badEvalReq);
  record('Avaliações', 'Validação: alcance no salto menor que parado é rejeitado', badEvalRes.status === 400, 'Rejeitado com status 400');

  // ---------------------------------------------------------
  // 6. HISTÓRICO DE AVALIAÇÕES (NÃO SOBRESCREVER, ACUMULAÇÃO)
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 6: HISTÓRICO DE AVALIAÇÕES ---');
  // Segunda avaliação em data posterior
  const eval2Req = makeRequest('/api/evaluations', 'POST', {
    evaluation_date: '2026-09-20',
    full_name: 'Lucas Silva Capitão IFAL',
    birth_date: '2004-03-15',
    weight: 85.0,
    height: 194.5,
    reach_standing: 245,
    reach_jumping: 334, // salto evoluiu para 89cm
    wingspan: 201,
    attack_reach: 341,
    block_reach: 325,
    position: 'Ponteiro',
    laterality: 'Destro',
    serve_types: ['Viagem'],
    goals: 'Meta atingida!',
    notes: 'Segunda avaliação do ano',
  }, tokenUser1);

  const eval2Res = await evalPostRoute(eval2Req);
  record('Histórico', 'Registrar 2ª avaliação em data distinta', eval2Res.status === 200, 'Criada com sucesso');

  // Consultar histórico via GET
  const histReq = makeRequest('/api/evaluations', 'GET', undefined, tokenUser1);
  const histRes = await evalGetRoute(histReq);
  const histData = await histRes.json();
  const evalsList = histData.evaluations || [];
  record('Histórico', 'Listagem preserva múltiplas avaliações sem sobrescrever', evalsList.length >= 2, `Total de avaliações: ${evalsList.length}`);
  record('Histórico', 'Avaliações ordenadas corretamente por data', evalsList[0].evaluation_date <= evalsList[1].evaluation_date, `Datas: ${evalsList[0].evaluation_date} e ${evalsList[1].evaluation_date}`);

  // ---------------------------------------------------------
  // 7. TIME (CRIAR, CONVITE, ENTRAR, INTEGRANTES, SAIR)
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 7: SISTEMA DE TIME E COLABORAÇÃO ---');
  // Conta 1 cria o TIME
  const createTeamReq = makeRequest('/api/teams', 'POST', {
    name: 'IFAL Vôlei Masculino',
    description: 'Equipe oficial de voleibol do IFAL Campus Maceió',
  }, tokenUser1);

  const createTeamRes = await teamPostRoute(createTeamReq);
  const createTeamData = await createTeamRes.json();
  const teamCreated = createTeamData.team;
  teamCode = teamCreated?.code || '';
  record('Criar TIME', 'Criar equipe e associar criador como capitão', createTeamRes.status === 200 && Boolean(teamCode), `Nome: "${teamCreated?.name}", Código: ${teamCode}`);

  // Consultar time pela Conta 1
  const teamGetReq = makeRequest('/api/teams', 'GET', undefined, tokenUser1);
  const teamGetRes = await teamGetRoute(teamGetReq);
  const teamGetData = await teamGetRes.json();
  record('TIME', 'Criador visualiza sua equipe no painel', teamGetData.team?.name === 'IFAL Vôlei Masculino', `Integrantes atuais: ${teamGetData.team?.members?.length || 1}`);

  // Conta 2 entra no time usando o código
  const joinTeamReq = makeRequest('/api/teams/join', 'POST', { code: teamCode }, tokenUser2);
  const joinTeamRes = await joinTeamRoute(joinTeamReq);
  const joinTeamData = await joinTeamRes.json();
  record('Entrar no TIME', 'Conta 2 entra na equipe usando código de convite', joinTeamRes.status === 200, `Mensagem: ${joinTeamData.message}`);

  // Teste de entrada duplicada
  const dupJoinReq = makeRequest('/api/teams/join', 'POST', { code: teamCode }, tokenUser2);
  const dupJoinRes = await joinTeamRoute(dupJoinReq);
  record('Entrar no TIME', 'Impedir associação duplicada ao mesmo time', dupJoinRes.status === 400, 'Bloqueado com status 400');

  // Verificar integrantes (deve conter Conta 1 e Conta 2)
  const rosterReq = makeRequest('/api/team', 'GET', undefined, tokenUser1);
  const rosterRes = await teamAthletesGetRoute(rosterReq);
  const rosterData = await rosterRes.json();
  const athletes = rosterData.athletes || [];
  const hasUser1 = athletes.some((m: any) => m.id === idUser1);
  const hasUser2 = athletes.some((m: any) => m.id === idUser2);
  record('Integrantes', 'Ambos os atletas aparecem no elenco do TIME', hasUser1 && hasUser2 && athletes.length >= 2, `Total de integrantes: ${athletes.length} (${athletes.map((a: any) => a.name).join(', ')})`);

  // Conta 2 sai do time
  const leaveReq = makeRequest('/api/teams/leave', 'POST', {}, tokenUser2);
  const leaveRes = await leaveTeamRoute(leaveReq);
  record('Sair do TIME', 'Conta 2 sai da equipe voluntariamente', leaveRes.status === 200, 'Saída confirmada');

  // Verificar elenco após a saída de Conta 2
  const rosterAfterLeaveRes = await teamAthletesGetRoute(makeRequest('/api/team', 'GET', undefined, tokenUser1));
  const rosterAfterLeaveData = await rosterAfterLeaveRes.json();
  const athletesAfter = rosterAfterLeaveData.athletes || [];
  const user2StillIn = athletesAfter.some((m: any) => m.id === idUser2);
  record('Sair do TIME', 'Elenco atualizado refletindo a saída', !user2StillIn, `Total restante: ${athletesAfter.length}`);

  // ---------------------------------------------------------
  // 8. SEGURANÇA E ISOLAMENTO DE DADOS
  // ---------------------------------------------------------
  console.log('\n--- ETAPA 8: SEGURANÇA E ISOLAMENTO ---');
  // Conta 2 tenta excluir avaliação da Conta 1
  if (eval1Id) {
    const unauthDeleteReq = makeRequest(`/api/evaluations/${eval1Id}`, 'DELETE', {}, tokenUser2);
    const unauthDeleteRes = await evalDeleteRoute(unauthDeleteReq, { params: { id: eval1Id } });
    record('Segurança', 'Bloqueio de exclusão de avaliação de outro atleta', unauthDeleteRes.status === 404 || unauthDeleteRes.status === 403, `Status retornado: ${unauthDeleteRes.status}`);
  }

  // Acesso sem token
  const noTokenReq = makeRequest('/api/evaluations', 'GET');
  const noTokenRes = await evalGetRoute(noTokenReq);
  record('Segurança', 'Bloqueio de acesso a dados privados sem autenticação', noTokenRes.status === 401, 'Status 401 retornado');

  // Limpeza dos usuários de teste criados nesta execução
  console.log('\n--- LIMPEZA DOS REGISTROS DE TESTE ---');
  try {
    db.prepare('DELETE FROM evaluations WHERE user_id IN (?, ?)').run(idUser1, idUser2);
    db.prepare('DELETE FROM team_members WHERE user_id IN (?, ?)').run(idUser1, idUser2);
    if (teamCreated?.id) {
      db.prepare('DELETE FROM teams WHERE id = ?').run(teamCreated.id);
    }
    db.prepare('DELETE FROM profiles WHERE user_id IN (?, ?)').run(idUser1, idUser2);
    db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(idUser1, idUser2);
    db.prepare('DELETE FROM password_resets WHERE email IN (?, ?)').run(emailUser1, emailUser2);
    console.log('✅ Registros de teste limpos com sucesso.');
  } catch (cleanErr) {
    console.warn('Erro ao limpar testes:', cleanErr);
  }

  // ---------------------------------------------------------
  // RESUMO FINAL
  // ---------------------------------------------------------
  console.log('\n===================================================================');
  console.log('TABELA RESUMO DE RESULTADOS DOS TESTES REAIS');
  console.log('===================================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL: ${results.length} | APROVADOS: ${passed} | FALHOS: ${failed}`);
  console.log('===================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2E().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
