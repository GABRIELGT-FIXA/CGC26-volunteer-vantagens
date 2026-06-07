import prisma from '../config/prisma';
import { isCheckInOpen, isCheckOutOpen } from '../utils/windows';
import { scheduleTaskJobs, cancelTaskJobs } from '../jobs/task.jobs';
import { dayBoundsInTz } from '../utils/timezone';

const taskSelect = {
  id: true, name: true, description: true, points: true,
  startTime: true, endTime: true, windowMinutes: true, checkOutOffsetMinutes: true, createdAt: true,
};

export async function listTasks(filters: { date?: string; status?: string }) {
  const where: Record<string, unknown> = {};

  if (filters.date) {
    const { start, end } = dayBoundsInTz(filters.date);
    where.startTime = { gte: start, lt: end };
  }

  const tasks = await prisma.task.findMany({ where, select: taskSelect, orderBy: { startTime: 'asc' } });

  if (filters.status) {
    const now = new Date();
    return tasks.filter((t) => {
      const windowEnd = new Date(t.endTime.getTime() + t.windowMinutes * 60 * 1000);
      if (filters.status === 'futura') return t.startTime > now;
      if (filters.status === 'em_andamento') return t.startTime <= now && windowEnd >= now;
      if (filters.status === 'encerrada') return windowEnd < now;
      return true;
    });
  }

  return tasks;
}

export async function getTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id }, select: taskSelect });
  if (!task) throw Object.assign(new Error('Tarefa não encontrada'), { status: 404 });
  return task;
}

export async function getWindowStatus(id: string) {
  const task = await getTask(id);
  return {
    task,
    checkInOpen: isCheckInOpen(task.startTime, task.windowMinutes),
    checkOutOpen: isCheckOutOpen(task.endTime, task.windowMinutes, task.checkOutOffsetMinutes),
  };
}

export async function createTask(data: {
  name: string; description?: string; points: number;
  startTime: Date; endTime: Date; windowMinutes: number;
}) {
  const task = await prisma.task.create({ data, select: taskSelect });
  scheduleTaskJobs(task);
  return task;
}

export async function updateTask(id: string, data: {
  name?: string; description?: string; points?: number;
  startTime?: Date; endTime?: Date; windowMinutes?: number;
}) {
  const task = await getTask(id);
  const updated = await prisma.task.update({ where: { id }, data, select: taskSelect });
  if (data.startTime || data.endTime || data.windowMinutes) {
    cancelTaskJobs(id);
    scheduleTaskJobs(updated);
  }
  return updated;
}

export async function deleteTask(id: string) {
  const participationCount = await prisma.participation.count({ where: { taskId: id } });
  if (participationCount > 0) {
    throw Object.assign(new Error('Não é possível excluir tarefa com participações'), { status: 409 });
  }
  cancelTaskJobs(id);
  await prisma.task.delete({ where: { id } });
}

export async function getTaskParticipations(taskId: string) {
  await getTask(taskId);
  return prisma.participation.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, fullName: true, profilePhoto: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
