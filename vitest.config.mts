import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  test: {
    name: 'unit',
    include: ['src/test/unit/**/*.test.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      exclude: ['src/test/**', 'src/**/*.d.ts', '**/node_modules/**'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/unit',
    },
  },
});
