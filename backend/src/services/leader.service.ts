import prisma from '../config/prisma';
import { LEADER_EVALUATION_MAX } from '../config/constants';
import { voteStatus } from '../utils/scoring';

// Retorna o teamId que o usuário lidera (ou lança 403 se não for líder)
async function requireLeaderTeam(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { leaderTeamId: true },
  });
  if (!user?.leaderTeamId) {
    throw Object.assign(new Error('Acesso restrito a líderes'), { status: 403 });
  }
  return user.leaderTeamId;
}

// Lista TODOS os participantes (qualquer time) para o líder votar, com o time
// de cada um e o status do voto (disponível / meu / bloqueado por outro líder).
export async function getVotables(leaderId: string) {
  await requireLeaderTeam(leaderId);

  const users = await prisma.user.findMany({
    where: { role: 'PARTICIPANT', id: { not: leaderId } },
    select: {
      id: true, fullName: true, profilePhoto: true,
      teams: { include: { team: { select: { id: true, name: true } } } },
    },
    orderBy: { fullName: 'asc' },
  });

  const evals = await prisma.pointBonus.findMany({
    where: { type: 'LEADER_EVALUATION' },
    select: { userId: true, points: true, createdById: true },
  });
  const evalMap = new Map(evals.map((e) => [e.userId, e]));

  // nomes dos líderes avaliadores
  const leaderIds = [...new Set(evals.map((e) => e.createdById).filter(Boolean) as string[])];
  const leaders = await prisma.user.findMany({ where: { id: { in: leaderIds } }, select: { id: true, fullName: true } });
  const leaderName = new Map(leaders.map((l) => [l.id, l.fullName]));

  return {
    max: LEADER_EVALUATION_MAX,
    people: users.map((u) => {
      const ev = evalMap.get(u.id);
      const status = voteStatus(ev?.createdById ?? null, leaderId);
      return {
        id: u.id,
        fullName: u.fullName,
        profilePhoto: u.profilePhoto,
        teams: u.teams.map((t) => t.team.name),
        status, // 'available' | 'mine' | 'locked'
        points: ev?.points ?? null,
        evaluatedBy: ev && status === 'locked' ? (leaderName.get(ev.createdById!) ?? 'outro líder') : null,
      };
    }),
  };
}

// Líder vota/avalia uma pessoa (qualquer time), nota 0–650.
// Regra: 1 voto por pessoa; o primeiro líder fica com ela (outro recebe 409).
export async function evaluate(leaderId: string, targetUserId: string, points: number) {
  await requireLeaderTeam(leaderId);

  if (points < 0 || points > LEADER_EVALUATION_MAX) {
    throw Object.assign(new Error(`A nota deve estar entre 0 e ${LEADER_EVALUATION_MAX}`), { status: 400 });
  }
  if (targetUserId === leaderId) {
    throw Object.assign(new Error('Você não pode votar em si mesmo'), { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, teams: { select: { teamId: true } } },
  });
  if (!target || target.role !== 'PARTICIPANT') {
    throw Object.assign(new Error('Participante não encontrado'), { status: 404 });
  }
  const targetTeamId = target.teams[0]?.teamId;
  if (!targetTeamId) {
    throw Object.assign(new Error('Este participante não está em nenhum time'), { status: 400 });
  }

  const existing = await prisma.pointBonus.findUnique({
    where: { userId_type: { userId: targetUserId, type: 'LEADER_EVALUATION' } },
  });
  if (existing && existing.createdById !== leaderId) {
    throw Object.assign(new Error('Esta pessoa já foi votada por outro líder'), { status: 409 });
  }

  return prisma.pointBonus.upsert({
    where: { userId_type: { userId: targetUserId, type: 'LEADER_EVALUATION' } },
    create: { userId: targetUserId, teamId: targetTeamId, type: 'LEADER_EVALUATION', points, createdById: leaderId },
    update: { points, teamId: targetTeamId, createdById: leaderId },
    select: { userId: true, points: true, updatedAt: true },
  });
}

// Líder remove o próprio voto (libera a pessoa para outro líder).
export async function removeVote(leaderId: string, targetUserId: string) {
  await requireLeaderTeam(leaderId);
  const existing = await prisma.pointBonus.findUnique({
    where: { userId_type: { userId: targetUserId, type: 'LEADER_EVALUATION' } },
  });
  if (!existing) throw Object.assign(new Error('Voto não encontrado'), { status: 404 });
  if (existing.createdById !== leaderId) {
    throw Object.assign(new Error('Você só pode remover o seu próprio voto'), { status: 403 });
  }
  await prisma.pointBonus.delete({ where: { userId_type: { userId: targetUserId, type: 'LEADER_EVALUATION' } } });
}

// Votos do próprio líder (para a verificação dele)
export async function getMyVotes(leaderId: string) {
  await requireLeaderTeam(leaderId);
  return listEvaluations({ evaluatorId: leaderId });
}

// Lista de avaliações (verificação). Admin: todas; líder: filtra pelas dele.
export async function listEvaluations(filters: { evaluatorId?: string } = {}) {
  const where: Record<string, unknown> = { type: 'LEADER_EVALUATION' };
  if (filters.evaluatorId) where.createdById = filters.evaluatorId;

  const evals = await prisma.pointBonus.findMany({
    where,
    select: {
      points: true, createdById: true, createdAt: true, updatedAt: true,
      user: { select: { id: true, fullName: true, profilePhoto: true, teams: { include: { team: { select: { name: true } } } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const leaderIds = [...new Set(evals.map((e) => e.createdById).filter(Boolean) as string[])];
  const leaders = await prisma.user.findMany({ where: { id: { in: leaderIds } }, select: { id: true, fullName: true } });
  const leaderName = new Map(leaders.map((l) => [l.id, l.fullName]));

  return evals.map((e) => ({
    pessoa: e.user.fullName,
    pessoaId: e.user.id,
    profilePhoto: e.user.profilePhoto,
    time: e.user.teams.map((t) => t.team.name).join(', ') || '—',
    lider: e.createdById ? (leaderName.get(e.createdById) ?? '—') : '—',
    nota: e.points,
    data: e.updatedAt,
  }));
}
