import { describe, it, expect } from 'vitest';
import { isCheckInOpen, isCheckOutOpen } from '../../src/utils/windows';

// Tarefa: início 21:25 BRT = 2026-06-11T00:25:00Z (instante UTC armazenado)
const start = new Date('2026-06-11T00:25:00Z');
const end = new Date('2026-06-11T01:25:00Z');

describe('isCheckInOpen (deve funcionar comparando instantes UTC, qualquer fuso de servidor)', () => {
  it('fechado antes do início', () => {
    expect(isCheckInOpen(start, 10, new Date('2026-06-11T00:24:59Z'))).toBe(false);
  });
  it('aberto no início', () => {
    expect(isCheckInOpen(start, 10, new Date('2026-06-11T00:25:00Z'))).toBe(true);
  });
  it('aberto dentro da janela', () => {
    expect(isCheckInOpen(start, 10, new Date('2026-06-11T00:30:00Z'))).toBe(true);
  });
  it('fechado após a janela', () => {
    expect(isCheckInOpen(start, 10, new Date('2026-06-11T00:35:01Z'))).toBe(false);
  });
  it('janela longa (180min) ainda aberta 2h depois', () => {
    expect(isCheckInOpen(start, 180, new Date('2026-06-11T02:25:00Z'))).toBe(true);
  });
});

describe('isCheckOutOpen', () => {
  it('abre no endTime (offset 0)', () => {
    expect(isCheckOutOpen(end, 10, 0, new Date('2026-06-11T01:25:00Z'))).toBe(true);
  });
  it('fechado antes do endTime', () => {
    expect(isCheckOutOpen(end, 10, 0, new Date('2026-06-11T01:24:59Z'))).toBe(false);
  });
  it('abre antes do fim com offset negativo (-30min)', () => {
    expect(isCheckOutOpen(end, 10, -30, new Date('2026-06-11T00:55:00Z'))).toBe(true);
  });
  it('fechado após a janela de check-out', () => {
    expect(isCheckOutOpen(end, 10, 0, new Date('2026-06-11T01:35:01Z'))).toBe(false);
  });
});
