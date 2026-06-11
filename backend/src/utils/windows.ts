// startTime/endTime vêm do banco como instantes UTC. A hora atual (new Date())
// também é um instante UTC. Comparar instantes é correto em QUALQUER fuso do
// servidor — a conversão de timezone serve só para exibir/formatar, não para comparar.

export function isCheckInOpen(startTime: Date, windowMinutes: number): boolean {
  const now = new Date();
  const windowEnd = new Date(startTime.getTime() + windowMinutes * 60 * 1000);
  return now >= startTime && now <= windowEnd;
}

export function isCheckOutOpen(endTime: Date, windowMinutes: number, checkOutOffsetMinutes = 0): boolean {
  const now = new Date();
  const windowStart = new Date(endTime.getTime() + checkOutOffsetMinutes * 60 * 1000);
  const windowEnd   = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);
  return now >= windowStart && now <= windowEnd;
}
