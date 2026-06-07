import { formatDate, formatTime } from './timezone';

interface MessageVars {
  taskName?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  points?: number;
  windowMinutes?: number;
}

export function interpolateMessage(template: string, vars: MessageVars): string {
  return template
    .replace(/\{\{taskName\}\}/g, vars.taskName ?? '')
    .replace(/\{\{date\}\}/g, vars.date ? formatDate(vars.date) : '')
    .replace(/\{\{startTime\}\}/g, vars.startTime ? formatTime(vars.startTime) : '')
    .replace(/\{\{endTime\}\}/g, vars.endTime ? formatTime(vars.endTime) : '')
    .replace(/\{\{points\}\}/g, vars.points !== undefined ? String(vars.points) : '')
    .replace(/\{\{windowMinutes\}\}/g, vars.windowMinutes !== undefined ? String(vars.windowMinutes) : '');
}
