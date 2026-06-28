import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Testes de integração contra o backend local (http://localhost:3001).
// Requer: backend rodando + banco acessível. Rode com: npm run test:int
// Cria entidades únicas e limpa tudo no final.

const BASE = process.env.TEST_BASE || 'http://localhost:3001/api';
const stamp = Date.now().toString().slice(-7);

let adminToken = '';
const created = { users: [] as string[], teams: [] as string[], tasks: [] as string[] };

async function login(phone: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const j = await res.json();
  if (!j.accessToken) throw new Error('login falhou para ' + phone);
  return j.accessToken;
}

async function api(path: string, method: string, token: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

async function sendPhoto(path: string, token: string, fields: Record<string, string> = {}) {
  const fd = new FormData();
  fd.append('photo', new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), 'p.jpg');
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

async function createUser(phone: string, name: string, teamId: string): Promise<string> {
  const r = await api('/users', 'POST', adminToken, {
    fullName: name, age: 25, phone, password: '123456',
    securityQuestion: 'Qual o nome do seu primeiro animal de estimação?', securityAnswer: 'x',
    teamIds: [teamId], role: 'PARTICIPANT',
  });
  created.users.push(r.data.id);
  return r.data.id;
}

function isoMinutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}

beforeAll(async () => {
  adminToken = await login('21979509936', 'admin123');
  const t = await api('/teams', 'POST', adminToken, { name: `__IT_${stamp}__` });
  created.teams.push(t.data.id);
});

afterAll(async () => {
  for (const id of created.tasks) await api(`/tasks/${id}`, 'DELETE', adminToken).catch(() => {});
  for (const id of created.users) await api(`/users/${id}`, 'DELETE', adminToken).catch(() => {});
  for (const id of created.teams) await api(`/teams/${id}`, 'DELETE', adminToken).catch(() => {});
});

describe('Auditoria controla os pontos', () => {
  it('aprovar credita e reprovar desconta no ranking', async () => {
    const teamId = created.teams[0];
    const userId = await createUser(`9${stamp}01`, 'IT Audit', teamId);
    const userToken = await login(`9${stamp}01`, '123456');

    // tarefa de 2 fotos com janelas abertas agora
    const task = await api('/tasks', 'POST', adminToken, {
      name: `IT Audit ${stamp}`, points: 100,
      startTime: isoMinutesFromNow(-2), endTime: isoMinutesFromNow(-1),
      windowMinutes: 60, checkOutOffsetMinutes: 0,
    });
    created.tasks.push(task.data.id);

    await sendPhoto(`/participations/${task.data.id}/checkin`, userToken, { teamId });
    const co = await sendPhoto(`/participations/${task.data.id}/checkout`, userToken);
    expect(co.status).toBe(200);
    expect(co.data.pointsAwarded).toBe(100);

    // pega o id da participação via auditoria
    const audit = await api('/participations/audit', 'GET', adminToken);
    const part = audit.data.find((p: { user: { id: string } }) => p.user.id === userId);
    expect(part).toBeTruthy();

    // reprovar -> 0 pontos
    const rej = await api(`/participations/${part.id}/review`, 'PUT', adminToken, { consider: false });
    expect(rej.data.pointsAwarded).toBe(0);
    let pts = await api('/users/me/points', 'GET', userToken);
    expect(pts.data.participationPoints).toBe(0);

    // aprovar -> 100 pontos de volta
    const app = await api(`/participations/${part.id}/review`, 'PUT', adminToken, { consider: true });
    expect(app.data.pointsAwarded).toBe(100);
    pts = await api('/users/me/points', 'GET', userToken);
    expect(pts.data.participationPoints).toBe(100);
  });

  it('aprovar participação só com check-in faz a pessoa aparecer no ranking', async () => {
    const teamId = created.teams[0];
    const userId = await createUser(`9${stamp}04`, 'IT SoCheckin', teamId);
    const userToken = await login(`9${stamp}04`, '123456');

    // tarefa de 2 fotos; participante faz SÓ o check-in (status CHECKED_IN, 0 pts)
    const task = await api('/tasks', 'POST', adminToken, {
      name: `IT SoCheckin ${stamp}`, points: 120,
      startTime: isoMinutesFromNow(-2), endTime: isoMinutesFromNow(120),
      windowMinutes: 60, checkOutOffsetMinutes: 0,
    });
    created.tasks.push(task.data.id);

    const ci = await sendPhoto(`/participations/${task.data.id}/checkin`, userToken, { teamId });
    expect(ci.data.status).toBe('CHECKED_IN');
    expect(ci.data.pointsAwarded).toBe(0);

    // não aparece no ranking ainda (0 pontos)
    let rank = await api('/rankings/individual', 'GET', adminToken);
    expect(rank.data.find((e: { user?: { id: string } }) => e.user?.id === userId)).toBeFalsy();

    // admin aprova na auditoria
    const audit = await api('/participations/audit', 'GET', adminToken);
    const part = audit.data.find((p: { user: { id: string } }) => p.user.id === userId);
    await api(`/participations/${part.id}/review`, 'PUT', adminToken, { consider: true });

    // agora DEVE aparecer no ranking com os 120 pontos, mesmo sem check-out
    rank = await api('/rankings/individual', 'GET', adminToken);
    const entry = rank.data.find((e: { user?: { id: string }; totalPoints: number }) => e.user?.id === userId);
    expect(entry).toBeTruthy();
    expect(entry.totalPoints).toBe(120);
  });
});

describe('Tarefa de foto única', () => {
  it('uma foto conclui e credita; check-out é rejeitado', async () => {
    const teamId = created.teams[0];
    const userId = await createUser(`9${stamp}02`, 'IT Single', teamId);
    const userToken = await login(`9${stamp}02`, '123456');

    const task = await api('/tasks', 'POST', adminToken, {
      name: `IT Single ${stamp}`, points: 200,
      startTime: isoMinutesFromNow(-1), endTime: isoMinutesFromNow(60),
      windowMinutes: 60, singlePhoto: true,
    });
    created.tasks.push(task.data.id);

    const ci = await sendPhoto(`/participations/${task.data.id}/checkin`, userToken, { teamId });
    expect(ci.status).toBe(201);
    expect(ci.data.status).toBe('COMPLETED');
    expect(ci.data.pointsAwarded).toBe(200);

    const co = await sendPhoto(`/participations/${task.data.id}/checkout`, userToken);
    expect(co.status).toBe(400); // foto única não tem check-out
    expect(userId).toBeTruthy();
  });
});

describe('Converter tarefa para foto única', () => {
  it('check-in existente vira válido e pontua ao mudar para foto única', async () => {
    const teamId = created.teams[0];
    await createUser(`9${stamp}03`, 'IT Convert', teamId);
    const userToken = await login(`9${stamp}03`, '123456');

    // tarefa 2 fotos, faz só o check-in
    const task = await api('/tasks', 'POST', adminToken, {
      name: `IT Convert ${stamp}`, points: 300,
      startTime: isoMinutesFromNow(-1), endTime: isoMinutesFromNow(120),
      windowMinutes: 60, singlePhoto: false,
    });
    created.tasks.push(task.data.id);

    const ci = await sendPhoto(`/participations/${task.data.id}/checkin`, userToken, { teamId });
    expect(ci.data.status).toBe('CHECKED_IN');
    expect(ci.data.pointsAwarded).toBe(0);

    // admin converte para foto única
    await api(`/tasks/${task.data.id}`, 'PUT', adminToken, { singlePhoto: true });

    const pts = await api('/users/me/points', 'GET', userToken);
    expect(pts.data.participationPoints).toBe(300);
  });
});

describe('Votação do líder (cross-team, 1 voto por pessoa, primeiro fica)', () => {
  it('líder vota em outro time; outro líder é bloqueado; remover libera; admin vê tudo', async () => {
    const teamA = created.teams[0];
    const tB = await api('/teams', 'POST', adminToken, { name: `__ITb_${stamp}__` });
    created.teams.push(tB.data.id);
    const teamB = tB.data.id;

    // dois líderes (A no teamA, B no teamB) e um alvo no teamB
    const leaderAId = await createUser(`9${stamp}10`, 'Lider A', teamA);
    const leaderBId = await createUser(`9${stamp}11`, 'Lider B', teamB);
    const targetId = await createUser(`9${stamp}12`, 'Alvo B', teamB);
    await api(`/users/${leaderAId}`, 'PUT', adminToken, { leaderTeamId: teamA });
    await api(`/users/${leaderBId}`, 'PUT', adminToken, { leaderTeamId: teamB });

    const tokenA = await login(`9${stamp}10`, '123456');
    const tokenB = await login(`9${stamp}11`, '123456');

    // votáveis: líder A enxerga o alvo (de outro time) com o time dele
    const votables = await api('/leader/votables', 'GET', tokenA);
    const targetRow = votables.data.people.find((p: { id: string }) => p.id === targetId);
    expect(targetRow).toBeTruthy();
    expect(targetRow.teams.length).toBeGreaterThan(0); // mostra o time
    expect(targetRow.status).toBe('available');

    // líder A vota no alvo (cross-team) com nota 500
    const v = await api('/leader/evaluate', 'POST', tokenA, { userId: targetId, points: 500 });
    expect(v.status).toBe(200);

    // líder B tenta votar no mesmo alvo -> 409 (já votado)
    const blocked = await api('/leader/evaluate', 'POST', tokenB, { userId: targetId, points: 600 });
    expect(blocked.status).toBe(409);

    // ranking: alvo aparece com 500 e o time dele (teamB) recebe os pontos
    const ri = await api('/rankings/individual', 'GET', adminToken);
    expect(ri.data.find((e: { user?: { id: string }; totalPoints: number }) => e.user?.id === targetId)?.totalPoints).toBe(500);
    const rt = await api('/rankings/teams', 'GET', adminToken);
    expect((rt.data.find((e: { team?: { id: string }; totalPoints: number }) => e.team?.id === teamB)?.totalPoints ?? 0)).toBeGreaterThanOrEqual(500);

    // admin vê a votação na verificação
    const all = await api('/leader/all-evaluations', 'GET', adminToken);
    expect(all.data.find((x: { pessoaId: string }) => x.pessoaId === targetId)).toBeTruthy();

    // participante comum não acessa votáveis -> 403
    const partTok = await login(`9${stamp}12`, '123456');
    const forbidden = await api('/leader/votables', 'GET', partTok);
    expect(forbidden.status).toBe(403);

    // líder A remove o próprio voto -> alvo fica disponível -> líder B consegue votar
    const del = await api(`/leader/evaluate/${targetId}`, 'DELETE', tokenA);
    expect(del.status).toBe(204);
    const nowB = await api('/leader/evaluate', 'POST', tokenB, { userId: targetId, points: 300 });
    expect(nowB.status).toBe(200);
  });
});
