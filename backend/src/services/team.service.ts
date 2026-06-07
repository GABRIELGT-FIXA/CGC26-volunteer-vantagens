import prisma from '../config/prisma';

const teamSelect = {
  id: true, name: true, createdAt: true,
  members: { include: { user: { select: { id: true, fullName: true, profilePhoto: true } } } },
};

export async function listTeams() {
  return prisma.team.findMany({ select: teamSelect, orderBy: { name: 'asc' } });
}

export async function getTeam(id: string) {
  const team = await prisma.team.findUnique({ where: { id }, select: teamSelect });
  if (!team) throw Object.assign(new Error('Time não encontrado'), { status: 404 });
  return team;
}

export async function createTeam(name: string) {
  const existing = await prisma.team.findUnique({ where: { name } });
  if (existing) throw Object.assign(new Error('Nome de time já existe'), { status: 409 });
  return prisma.team.create({ data: { name }, select: teamSelect });
}

export async function updateTeam(id: string, name: string) {
  await getTeam(id);
  return prisma.team.update({ where: { id }, data: { name }, select: teamSelect });
}

export async function deleteTeam(id: string) {
  await getTeam(id);
  await prisma.team.delete({ where: { id } });
}

export async function addMember(teamId: string, userId: string) {
  await getTeam(teamId);
  return prisma.userTeam.create({ data: { teamId, userId } });
}

export async function removeMember(teamId: string, userId: string) {
  await getTeam(teamId);
  await prisma.userTeam.deleteMany({ where: { teamId, userId } });
}
