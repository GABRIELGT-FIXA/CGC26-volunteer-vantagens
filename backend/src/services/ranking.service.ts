import prisma from '../config/prisma';

export async function individualRanking() {
  // Pontos de participações concluídas, por usuário
  const partByUser = await prisma.participation.groupBy({
    by: ['userId'],
    where: { status: 'COMPLETED' },
    _sum: { pointsAwarded: true },
  });

  // Pontos de bônus, por usuário
  const bonusByUser = await prisma.pointBonus.groupBy({
    by: ['userId'],
    _sum: { points: true },
  });

  const totals = new Map<string, number>();
  partByUser.forEach((r) => totals.set(r.userId, (totals.get(r.userId) ?? 0) + (r._sum.pointsAwarded ?? 0)));
  bonusByUser.forEach((r) => totals.set(r.userId, (totals.get(r.userId) ?? 0) + (r._sum.points ?? 0)));

  const userIds = [...totals.keys()];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, role: 'PARTICIPANT' },
    select: {
      id: true, fullName: true, profilePhoto: true,
      teams: { include: { team: { select: { id: true, name: true } } } },
    },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return [...totals.entries()]
    .filter(([id]) => userMap.has(id)) // só participantes
    .map(([id, total]) => ({ user: userMap.get(id), totalPoints: total }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, idx) => ({ position: idx + 1, ...entry }));
}

export async function teamsRanking() {
  const partByTeam = await prisma.participation.groupBy({
    by: ['teamId'],
    where: { status: 'COMPLETED' },
    _sum: { pointsAwarded: true },
  });

  const bonusByTeam = await prisma.pointBonus.groupBy({
    by: ['teamId'],
    _sum: { points: true },
  });

  const totals = new Map<string, number>();
  partByTeam.forEach((r) => totals.set(r.teamId, (totals.get(r.teamId) ?? 0) + (r._sum.pointsAwarded ?? 0)));
  bonusByTeam.forEach((r) => totals.set(r.teamId, (totals.get(r.teamId) ?? 0) + (r._sum.points ?? 0)));

  const teamIds = [...totals.keys()];
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true, name: true,
      members: { include: { user: { select: { id: true, fullName: true, profilePhoto: true } } } },
    },
  });
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return [...totals.entries()]
    .filter(([id]) => teamMap.has(id))
    .map(([id, total]) => ({ team: teamMap.get(id), totalPoints: total }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, idx) => ({ position: idx + 1, ...entry }));
}
