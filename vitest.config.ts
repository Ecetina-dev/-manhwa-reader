import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.data'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.data/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/vite.config.ts',
        '**/svelte.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '$lib': '/src/lib',
      '$lib/*': '/src/lib/*'
    }
  }
});
