import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { telegramBackButtonPlugin } from './src/vite/telegram-back-button-plugin';

const root = path.dirname(fileURLToPath(import.meta.url));
const upstream = path.resolve(root, 'vendor/openchamber/packages');
const ui = path.join(upstream, 'ui/src');
const web = path.join(upstream, 'web/src');
const sdk = path.join(upstream, 'sdk/src');

export default defineConfig({
  base: process.env.VITE_BASE_PATH?.trim() || '/',
  worker: { format: 'es' },
  plugins: [telegramBackButtonPlugin(), react()],
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
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      external: ['node:child_process', 'node:fs', 'node:path', 'node:url', 'node:os'],
      output: {
        // Keep the mobile entry and dynamically loaded feature dependencies
        // split as upstream expects. In particular, do not pull Shiki grammars,
        // diff highlights, or syntax modes into the eager renderer bundle.
        manualChunks(id) {
          if (id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill')) {
            return 'vendor-vite-runtime';
          }
          if (!id.includes('node_modules')) return undefined;
          if (id.endsWith('.css')) return undefined;

          const lastNodeModules = id.lastIndexOf('node_modules/');
          const match = id.slice(lastNodeModules + 'node_modules/'.length);
          if (!match) return undefined;

          const segments = match.split('/');
          const packageName = match.startsWith('@')
            ? `${segments[0]}/${segments[1]}`
            : segments[0];

          if (
            packageName === '@shikijs/langs' ||
            packageName === '@shikijs/themes' ||
            packageName === '@codemirror/legacy-modes' ||
            packageName === '@pierre/diffs' ||
            packageName === '@pierre/highlights'
          ) {
            return undefined;
          }

          if (packageName === 'react' || packageName === 'react-dom') return 'vendor-react';
          if (packageName === 'zustand' || packageName === 'zustand/middleware') return 'vendor-zustand';
          if (packageName === '@opencode/client') return 'vendor-opencode-client';
          if (packageName.includes('remark') || packageName.includes('rehype') || packageName === 'react-markdown') return 'vendor-markdown';
          if (packageName === '@base-ui/react' || packageName.startsWith('@base-ui')) return 'vendor-base-ui';

          const sanitized = packageName.replace(/^@/, '').replace(/\\//g, '-');
          return `vendor-${sanitized}`;
        },
      },
    },

  },
});
