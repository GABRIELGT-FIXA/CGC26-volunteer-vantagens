import prisma from '../config/prisma';
import { ALL_CHALLENGES_POINTS } from '../config/constants';

// Verifica se o usuário concluiu TODOS os desafios (tarefas) e, em caso afirmativo,
// credita o bônus de 650 pontos uma única vez.
export async function checkAllChallengesBonus(userId: string, fallbackTeamId: string) {
  const totalTasks = await prisma.task.count();
  if (totalTasks === 0) return;

  const completed = await prisma.participation.count({
    where: { userId, status: 'COMPLETED' },
  });

  if (completed < totalTasks) return;

  // Já tem o bônus?
  const existing = await prisma.pointBonus.findUnique({
    where: { userId_type: { userId, type: 'ALL_CHALLENGES' } },
  });
  if (existing) return;

  await prisma.pointBonus.create({
    data: {
      userId,
      teamId: fallbackTeamId,
      type: 'ALL_CHALLENGES',
      points: ALL_CHALLENGES_POINTS,
    },
  });
}

// Pontos de bônus do usuário (para somar no total exibido)
export async function getUserBonuses(userId: string) {
  return prisma.pointBonus.findMany({
    where: { userId },
    select: { type: true, points: true, teamId: true, createdAt: true },
  });
}
