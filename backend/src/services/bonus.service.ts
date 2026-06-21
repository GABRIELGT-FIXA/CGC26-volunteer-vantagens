import prisma from '../config/prisma';
import { ALL_CHALLENGES_POINTS } from '../config/constants';

// Recalcula o bônus de "todos os desafios": concede se o usuário concluiu TODAS
// as tarefas com pontuação válida (pointsAwarded > 0); remove se deixou de cumprir.
// Chamado após check-out e após auditoria (aprovar/reprovar).
export async function recomputeAllChallengesBonus(userId: string, fallbackTeamId: string) {
  const totalTasks = await prisma.task.count();

  const validCompleted = await prisma.participation.count({
    where: { userId, status: 'COMPLETED', pointsAwarded: { gt: 0 } },
  });

  const existing = await prisma.pointBonus.findUnique({
    where: { userId_type: { userId, type: 'ALL_CHALLENGES' } },
  });

  const cumpriuTudo = totalTasks > 0 && validCompleted >= totalTasks;

  if (cumpriuTudo && !existing) {
    await prisma.pointBonus.create({
      data: { userId, teamId: fallbackTeamId, type: 'ALL_CHALLENGES', points: ALL_CHALLENGES_POINTS },
    });
  } else if (!cumpriuTudo && existing) {
    await prisma.pointBonus.delete({
      where: { userId_type: { userId, type: 'ALL_CHALLENGES' } },
    });
  }
}

// Pontos de bônus do usuário (para somar no total exibido)
export async function getUserBonuses(userId: string) {
  return prisma.pointBonus.findMany({
    where: { userId },
    select: { type: true, points: true, teamId: true, createdAt: true },
  });
}
