// Lógica pura de pontuação (testável sem banco)

// Resultado da auditoria: aprovar credita os pontos cheios; reprovar zera.
export function reviewOutcome(consider: boolean, taskPoints: number) {
  return {
    pointsAwarded: consider ? taskPoints : 0,
    valid: consider,
  };
}

// Status de voto do líder sobre uma pessoa (regra: primeiro líder fica com a pessoa).
// existingEvaluatorId = quem já votou nessa pessoa (null se ninguém).
export function voteStatus(
  existingEvaluatorId: string | null,
  leaderId: string
): 'available' | 'mine' | 'locked' {
  if (!existingEvaluatorId) return 'available';
  return existingEvaluatorId === leaderId ? 'mine' : 'locked';
}

// Tarefa de foto única: uma foto conclui a tarefa. Dentro da janela credita os
// pontos; fora da janela conclui mas com 0 pontos.
export function singlePhotoOutcome(checkInOpen: boolean, taskPoints: number) {
  return {
    status: 'COMPLETED' as const,
    checkInValid: checkInOpen,
    checkOutValid: checkInOpen,
    pointsAwarded: checkInOpen ? taskPoints : 0,
  };
}
