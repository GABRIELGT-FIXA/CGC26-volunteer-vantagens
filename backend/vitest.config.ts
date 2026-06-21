import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Testes de integração fazem várias chamadas sequenciais ao Neon (latência alta).
    // Timeout maior só dá tempo das operações concluírem — não altera asserções.
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
