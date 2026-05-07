import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['templates/**/*.test.ts', 'templates/**/*.test.tsx'],
    globals: false,
  },
});
