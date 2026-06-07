import { env } from '../config/env';

// Retorna { start, end } em UTC correspondendo ao início e fim do dia local no timezone configurado
// Ex: "2026-06-04" em UTC-3 → { start: 2026-06-04T03:00Z, end: 2026-06-05T03:00Z }
export function dayBoundsInTz(dateStr: string): { start: Date; end: Date } {
  // Usa meio-dia UTC como referência para calcular o offset do timezone naquela data
  const ref = new Date(`${dateStr}T12:00:00Z`);
  const utcTime = new Date(ref.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const tzTime  = new Date(ref.toLocaleString('en-US', { timeZone: env.timezone })).getTime();
  const offsetMs = utcTime - tzTime; // positivo para UTC-3 (+10800000)

  const midnightUTC = new Date(`${dateStr}T00:00:00Z`).getTime();
  const start = new Date(midnightUTC + offsetMs);       // meia-noite local em UTC
  const end   = new Date(start.getTime() + 86_400_000); // +24h
  return { start, end };
}

export function nowInTz(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: env.timezone }));
}

export function toTz(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: env.timezone }));
}

export function formatDate(date: Date): string {
  return toTz(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: env.timezone,
  });
}

export function formatTime(date: Date): string {
  return toTz(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: env.timezone,
  });
}
