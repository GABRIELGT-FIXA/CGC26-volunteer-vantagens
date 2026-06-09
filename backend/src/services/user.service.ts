import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

const SALT_ROUNDS = 12;

const userSelect = {
  id: true, fullName: true, age: true, phone: true,
  profilePhoto: true, role: true, leaderTeamId: true, createdAt: true,
  teams: { include: { team: true } },
  leaderTeam: { select: { id: true, name: true } },
};

export async function listUsers() {
  return prisma.user.findMany({ select: userSelect, orderBy: { fullName: 'asc' } });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      participations: {
        include: { task: true, team: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
  return user;
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });
  return user;
}

export async function createUser(data: {
  fullName: string; age: number; phone: string; password: string;
  securityQuestion: string; securityAnswer: string; teamIds: string[];
  profilePhoto?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) throw Object.assign(new Error('Telefone já cadastrado'), { status: 409 });

  const [hashedPassword, hashedAnswer] = await Promise.all([
    bcrypt.hash(data.password, SALT_ROUNDS),
    bcrypt.hash(data.securityAnswer.toLowerCase().trim(), SALT_ROUNDS),
  ]);

  return prisma.user.create({
    data: {
      fullName: data.fullName, age: data.age, phone: data.phone,
      password: hashedPassword, profilePhoto: data.profilePhoto,
      securityQuestion: data.securityQuestion, securityAnswer: hashedAnswer,
      teams: { create: data.teamIds.map((teamId) => ({ teamId })) },
    },
    select: userSelect,
  });
}

export async function updateUser(id: string, data: {
  fullName?: string; age?: number; phone?: string; profilePhoto?: string;
  teamIds?: string[]; leaderTeamId?: string | null;
}) {
  await getUser(id);

  const { teamIds, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest };

  if (teamIds !== undefined) {
    await prisma.userTeam.deleteMany({ where: { userId: id } });
    updateData.teams = { create: teamIds.map((teamId) => ({ teamId })) };
  }

  return prisma.user.update({ where: { id }, data: updateData, select: userSelect });
}

export async function deleteUser(id: string) {
  await getUser(id);
  await prisma.user.delete({ where: { id } });
}

// Total de pontos do usuário: participações concluídas + bônus
export async function getMyPoints(userId: string) {
  const part = await prisma.participation.aggregate({
    where: { userId, status: 'COMPLETED' },
    _sum: { pointsAwarded: true },
  });
  const bonus = await prisma.pointBonus.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  const bonuses = await prisma.pointBonus.findMany({
    where: { userId },
    select: { type: true, points: true },
  });

  const participationPoints = part._sum.pointsAwarded ?? 0;
  const bonusPoints = bonus._sum.points ?? 0;
  return {
    participationPoints,
    bonusPoints,
    total: participationPoints + bonusPoints,
    bonuses,
  };
}

export async function updatePhoto(userId: string, filename: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { profilePhoto: `/uploads/${filename}` },
    select: userSelect,
  });
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw Object.assign(new Error('Senha atual incorreta'), { status: 401 });

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}
