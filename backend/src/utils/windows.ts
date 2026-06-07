import { nowInTz } from './timezone';

export function isCheckInOpen(startTime: Date, windowMinutes: number): boolean {
  const now = nowInTz();
  const windowEnd = new Date(startTime.getTime() + windowMinutes * 60 * 1000);
  return now >= startTime && now <= windowEnd;
}

export function isCheckOutOpen(endTime: Date, windowMinutes: number, checkOutOffsetMinutes = 0): boolean {
  const now = nowInTz();
  const windowStart = new Date(endTime.getTime() + checkOutOffsetMinutes * 60 * 1000);
  const windowEnd   = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);
  return now >= windowStart && now <= windowEnd;
}
