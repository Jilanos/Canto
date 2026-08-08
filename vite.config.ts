import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SW_TEMPLATE = resolve(ROOT, 'src/service-worker/sw-template.js');

/**
 * Emits `dist/sw.js` from the template, injecting the real hashed asset list of
 * the current bundle. Keeping the precache list build-generated is what makes
 * the offline guarantee (item_001 AC2) hold for the whole free-practice mode
 * instead of only for assets a visitor happened to request.
 */
function serviceWorkerPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'canto-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    generateBundle(_options, bundle) {
      // Source maps are debugging aids, not part of the offline runtime.
      const assets = Object.keys(bundle)
        .filter((name) => !name.endsWith('.map'))
        .map((name) => `/${name}`);
      const precache = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', ...assets];
      const template = readFileSync(SW_TEMPLATE, 'utf8');
      const source = template
        .replace('__PRECACHE_MANIFEST__', JSON.stringify([...new Set(precache)], null, 2))
        .replace('__CACHE_VERSION__', JSON.stringify(`canto-${Date.now().toString(36)}`));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
    closeBundle() {
      // Guard against a silently missing service worker in the published tree.
      const swPath = resolve(ROOT, outDir, 'sw.js');
      const contents = readFileSync(swPath, 'utf8');
      if (contents.includes('__PRECACHE_MANIFEST__')) {
        throw new Error('service worker precache manifest was not injected');
      }
      writeFileSync(swPath, contents);
    },
  };
}

export default defineConfig({
  // Canto is published at the root of https://canto.paulmondou.fr (ADR 001).
  base: '/',
  plugins: [serviceWorkerPlugin()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
