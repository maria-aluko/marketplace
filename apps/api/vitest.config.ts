import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    exclude: ['src/app.module.spec.ts'],
  },
  plugins: [swc.vite()],
});
