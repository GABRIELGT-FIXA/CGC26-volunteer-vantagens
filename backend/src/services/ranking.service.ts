import prisma from '../config/prisma';

export async function individualRanking() {
  const results = await prisma.participation.groupBy({
    by: ['userId'],
    where: { status: 'COMPLETED' },
    _sum: { pointsAwarded: true },
    orderBy: { _sum: { pointsAwarded: 'desc' } },
  });

  const userIds = results.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, role: 'PARTICIPANT' },
    select: {
      id: true, fullName: true, profilePhoto: true,
      teams: { include: { team: { select: { id: true, name: true } } } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return results.map((r, idx) => ({
    position: idx + 1,
    user: userMap.get(r.userId),
    totalPoints: r._sum.pointsAwarded ?? 0,
  }));
}

export async function teamsRanking() {
  const results = await prisma.participation.groupBy({
    by: ['teamId'],
    where: { status: 'COMPLETED' },
    _sum: { pointsAwarded: true },
    orderBy: { _sum: { pointsAwarded: 'desc' } },
  });

  const teamIds = results.map((r) => r.teamId);
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true, name: true,
      members: { include: { user: { select: { id: true, fullName: true, profilePhoto: true } } } },
    },
  });

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return results.map((r, idx) => ({
    position: idx + 1,
    team: teamMap.get(r.teamId),
    totalPoints: r._sum.pointsAwarded ?? 0,
  }));
}
