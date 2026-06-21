import { describe, it, expect } from 'vitest';
import { reviewOutcome, singlePhotoOutcome } from '../../src/utils/scoring';

describe('reviewOutcome (auditoria: aprovar credita, reprovar zera)', () => {
  it('aprovar credita os pontos cheios da tarefa', () => {
    expect(reviewOutcome(true, 350)).toEqual({ pointsAwarded: 350, valid: true });
  });
  it('reprovar zera os pontos', () => {
    expect(reviewOutcome(false, 350)).toEqual({ pointsAwarded: 0, valid: false });
  });
});

describe('singlePhotoOutcome (tarefa de foto única: 1 foto conclui)', () => {
  it('dentro da janela: conclui e credita os pontos', () => {
    expect(singlePhotoOutcome(true, 450)).toEqual({
      status: 'COMPLETED',
      checkInValid: true,
      checkOutValid: true,
      pointsAwarded: 450,
    });
  });
  it('fora da janela: conclui mas com 0 pontos', () => {
    expect(singlePhotoOutcome(false, 450)).toEqual({
      status: 'COMPLETED',
      checkInValid: false,
      checkOutValid: false,
      pointsAwarded: 0,
    });
  });
});
