import prisma from '../config/prisma';
import { LEADER_EVALUATION_MAX } from '../config/constants';

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

// Membros do time do líder + a avaliação atual de cada um
export async function getTeamMembers(leaderId: string) {
  const teamId = await requireLeaderTeam(leaderId);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true },
  });

  const memberships = await prisma.userTeam.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, fullName: true, profilePhoto: true, role: true } },
    },
  });

  // Só participantes (não mostra admins), e exclui o próprio líder
  const members = memberships
    .map((m) => m.user)
    .filter((u) => u.role === 'PARTICIPANT' && u.id !== leaderId);

  const evals = await prisma.pointBonus.findMany({
    where: { teamId, type: 'LEADER_EVALUATION', userId: { in: members.map((m) => m.id) } },
    select: { userId: true, points: true },
  });
  const evalMap = new Map(evals.map((e) => [e.userId, e.points]));

  return {
    team,
    max: LEADER_EVALUATION_MAX,
    members: members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      profilePhoto: m.profilePhoto,
      evaluation: evalMap.get(m.id) ?? null,
    })),
  };
}

// Líder avalia um membro do seu time (nota 0–650)
export async function evaluateMember(leaderId: string, memberId: string, points: number) {
  const teamId = await requireLeaderTeam(leaderId);

  if (points < 0 || points > LEADER_EVALUATION_MAX) {
    throw Object.assign(new Error(`A nota deve estar entre 0 e ${LEADER_EVALUATION_MAX}`), { status: 400 });
  }
  if (memberId === leaderId) {
    throw Object.assign(new Error('O líder não pode avaliar a si mesmo'), { status: 400 });
  }

  // O membro precisa pertencer ao time do líder
  const membership = await prisma.userTeam.findFirst({ where: { teamId, userId: memberId } });
  if (!membership) {
    throw Object.assign(new Error('Este usuário não pertence ao seu time'), { status: 404 });
  }

  return prisma.pointBonus.upsert({
    where: { userId_type: { userId: memberId, type: 'LEADER_EVALUATION' } },
    create: { userId: memberId, teamId, type: 'LEADER_EVALUATION', points, createdById: leaderId },
    update: { points, teamId, createdById: leaderId },
    select: { userId: true, points: true, updatedAt: true },
  });
}
