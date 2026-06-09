import prisma from '../config/prisma';
import { isCheckInOpen, isCheckOutOpen } from '../utils/windows';
import { checkAllChallengesBonus } from './bonus.service';

export async function checkIn(taskId: string, userId: string, teamId: string | null, photoFilename: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw Object.assign(new Error('Tarefa não encontrada'), { status: 404 });

  const checkInValid = isCheckInOpen(task.startTime, task.windowMinutes);

  const existing = await prisma.participation.findUnique({ where: { userId_taskId: { userId, taskId } } });
  if (existing) throw Object.assign(new Error('Check-in já realizado para esta tarefa'), { status: 409 });

  // Se não informou time, busca o primeiro time do usuário
  let resolvedTeamId = teamId;
  if (!resolvedTeamId) {
    const userTeam = await prisma.userTeam.findFirst({ where: { userId } });
    resolvedTeamId = userTeam?.teamId ?? null;
  }
  if (!resolvedTeamId) throw Object.assign(new Error('Usuário não pertence a nenhum time'), { status: 400 });

  return prisma.participation.create({
    data: {
      userId, taskId, teamId: resolvedTeamId,
      checkInPhoto: `/uploads/${photoFilename}`,
      checkInTime: new Date(),
      checkInValid,
      status: 'CHECKED_IN',
    },
    include: { task: true, team: true },
  });
}

export async function checkOut(taskId: string, userId: string, photoFilename: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw Object.assign(new Error('Tarefa não encontrada'), { status: 404 });

  const participation = await prisma.participation.findUnique({ where: { userId_taskId: { userId, taskId } } });
  if (!participation) throw Object.assign(new Error('Check-in não realizado'), { status: 409 });
  if (participation.status === 'COMPLETED') throw Object.assign(new Error('Check-out já realizado'), { status: 409 });

  const checkOutValid = isCheckOutOpen(task.endTime, task.windowMinutes, task.checkOutOffsetMinutes);
  const bothValid = participation.checkInValid && checkOutValid;

  const updated = await prisma.participation.update({
    where: { id: participation.id },
    data: {
      checkOutPhoto: `/uploads/${photoFilename}`,
      checkOutTime: new Date(),
      checkOutValid,
      status: 'COMPLETED',
      pointsAwarded: bothValid ? task.points : 0,
    },
    include: { task: true, team: true },
  });

  // Credita o bônus de "todos os desafios" se este foi o último a concluir
  await checkAllChallengesBonus(userId, participation.teamId);

  return updated;
}

export async function getMyParticipations(userId: string) {
  return prisma.participation.findMany({
    where: { userId },
    include: { task: true, team: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updatePoints(participationId: string, points: number) {
  const p = await prisma.participation.findUnique({ where: { id: participationId } });
  if (!p) throw Object.assign(new Error('Participação não encontrada'), { status: 404 });
  return prisma.participation.update({ where: { id: participationId }, data: { pointsAwarded: points } });
}

// === AUDITORIA ===

// Lista todas as participações que têm ao menos uma foto, para auditoria
export async function listForAudit(filters: { status?: string }) {
  const where: Record<string, unknown> = {
    OR: [{ checkInPhoto: { not: null } }, { checkOutPhoto: { not: null } }],
  };

  if (filters.status === 'pending') where.reviewed = false;
  if (filters.status === 'considered') { where.reviewed = true; where.pointsAwarded = { gt: 0 }; }
  if (filters.status === 'disconsidered') { where.reviewed = true; where.pointsAwarded = 0; }

  return prisma.participation.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true, profilePhoto: true } },
      task: { select: { id: true, name: true, points: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Considerar (conta os pontos da tarefa) ou desconsiderar (zera) uma participação
export async function reviewParticipation(participationId: string, consider: boolean) {
  const p = await prisma.participation.findUnique({
    where: { id: participationId },
    include: { task: { select: { points: true } } },
  });
  if (!p) throw Object.assign(new Error('Participação não encontrada'), { status: 404 });

  return prisma.participation.update({
    where: { id: participationId },
    data: {
      reviewed: true,
      checkInValid: consider,
      checkOutValid: consider,
      pointsAwarded: consider ? p.task.points : 0,
    },
    include: {
      user: { select: { id: true, fullName: true, profilePhoto: true } },
      task: { select: { id: true, name: true, points: true } },
      team: { select: { id: true, name: true } },
    },
  });
}
