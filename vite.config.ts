import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const upstream = path.resolve(root, 'vendor/openchamber/packages');
const ui = path.join(upstream, 'ui/src');
const web = path.join(upstream, 'web/src');
const sdk = path.join(upstream, 'sdk/src');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@openchamber/sdk/schemas', replacement: path.join(sdk, 'schemas.ts') },
      { find: '@openchamber/sdk/ui', replacement: path.join(sdk, 'ui/index.ts') },
      { find: '@openchamber/sdk', replacement: path.join(sdk, 'index.ts') },
      { find: '@openchamber/ui', replacement: ui },
      { find: '@web', replacement: web },
      { find: '@', replacement: ui },
    ],
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify('2.6.0'),
  },
  server: { host: '0.0.0.0' },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['node:child_process', 'node:fs', 'node:path', 'node:url', 'node:os'],
    },
  },
});
