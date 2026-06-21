// startTime/endTime vêm do banco como instantes UTC. A hora atual (new Date())
// também é um instante UTC. Comparar instantes é correto em QUALQUER fuso do
// servidor — a conversão de timezone serve só para exibir/formatar, não para comparar.
// `now` é injetável para testes determinísticos (default = agora).

export function isCheckInOpen(startTime: Date, windowMinutes: number, now: Date = new Date()): boolean {
  const windowEnd = new Date(startTime.getTime() + windowMinutes * 60 * 1000);
  return now >= startTime && now <= windowEnd;
}

export function isCheckOutOpen(
  endTime: Date,
  windowMinutes: number,
  checkOutOffsetMinutes = 0,
  now: Date = new Date()
): boolean {
  const windowStart = new Date(endTime.getTime() + checkOutOffsetMinutes * 60 * 1000);
  const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);
  return now >= windowStart && now <= windowEnd;
}
