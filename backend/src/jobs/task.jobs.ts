import cron from 'node-cron';
import prisma from '../config/prisma';
import { broadcast } from '../services/whatsapp.service';
import { interpolateMessage } from '../utils/interpolate';

type ScheduledTask = ReturnType<typeof cron.schedule>;

interface TaskJob {
  checkInJob: ScheduledTask;
  checkOutJob: ScheduledTask;
}

const taskJobs = new Map<string, TaskJob>();

function toCronExpression(date: Date): string {
  return `${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;
}

function buildCheckInMessage(task: { name: string; startTime: Date; endTime: Date; points: number; windowMinutes: number }): string {
  return interpolateMessage(
    '📸 *{{taskName}}* começou agora!\n\n📅 Data: {{date}}\n⏰ Horário: {{startTime}} — {{endTime}}\n⭐ Pontuação: {{points}} pontos\n\nVocê tem {{windowMinutes}} minutos para registrar sua chegada.\n\nAcesse a plataforma e tire sua foto de entrada! 🏁',
    { taskName: task.name, date: task.startTime, startTime: task.startTime, endTime: task.endTime, points: task.points, windowMinutes: task.windowMinutes }
  );
}

function buildCheckOutMessage(task: { name: string; startTime: Date; endTime: Date; points: number; windowMinutes: number }): string {
  return interpolateMessage(
    '📸 *{{taskName}}* está encerrando!\n\n📅 Data: {{date}}\n⏰ Horário: {{startTime}} — {{endTime}}\n⭐ Pontuação: {{points}} pontos\n\nVocê tem {{windowMinutes}} minutos para registrar sua saída.\n\nAcesse a plataforma e tire sua foto de saída! ✅',
    { taskName: task.name, date: task.endTime, startTime: task.startTime, endTime: task.endTime, points: task.points, windowMinutes: task.windowMinutes }
  );
}

export function scheduleTaskJobs(task: { id: string; name: string; startTime: Date; endTime: Date; points: number; windowMinutes: number }) {
  const now = new Date();
  const jobs: Partial<TaskJob> = {};

  if (task.startTime > now) {
    const checkInExpr = toCronExpression(task.startTime);
    jobs.checkInJob = cron.schedule(checkInExpr, () => {
      broadcast(buildCheckInMessage(task)).catch(console.error);
    }, { timezone: 'UTC' });
  }

  if (task.endTime > now) {
    const checkOutExpr = toCronExpression(task.endTime);
    jobs.checkOutJob = cron.schedule(checkOutExpr, () => {
      broadcast(buildCheckOutMessage(task)).catch(console.error);
    }, { timezone: 'UTC' });
  }

  if (jobs.checkInJob || jobs.checkOutJob) {
    taskJobs.set(task.id, jobs as TaskJob);
  }
}

export function cancelTaskJobs(taskId: string) {
  const jobs = taskJobs.get(taskId);
  if (jobs) {
    jobs.checkInJob?.stop();
    jobs.checkOutJob?.stop();
    taskJobs.delete(taskId);
  }
}

export async function initTaskJobs() {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: { OR: [{ startTime: { gt: now } }, { endTime: { gt: now } }] },
  });
  tasks.forEach(scheduleTaskJobs);
  console.log(`[Jobs] ${tasks.length} task job(s) agendado(s)`);
}
