import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

/**
 * Bundle functions for Firebase deploy.
 *
 * Why bundle: the source imports workspace packages (@ground/shared-types,
 * @ground/shared-logic) which exist only in the monorepo's hoisted
 * node_modules. Firebase deploy zips JUST the functions/ folder and runs
 * `npm install` server-side, so workspace `*` refs won't resolve there.
 * Bundling inlines them.
 *
 * What stays external: the Firebase runtime provides `firebase-admin` and
 * `firebase-functions` at runtime, so we mark them external and keep them
 * in dependencies. Everything else is inlined.
 *
 * We also write a minimal package.json next to the bundled output so the
 * Firebase deploy uploader picks up the Node runtime + the two runtime deps.
 */

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'lib/index.js',
  sourcemap: true,
  external: ['firebase-admin', 'firebase-admin/*', 'firebase-functions', 'firebase-functions/*'],
  logLevel: 'info',
});

// Emit a slim package.json alongside the bundle so Firebase resolves the
// `main` entry and installs only the two runtime deps server-side.
const pkg = {
  name: 'sarva-functions',
  version: '0.1.0',
  private: true,
  main: 'index.js',
  engines: { node: '20' },
  dependencies: {
    'firebase-admin': '^12.6.0',
    'firebase-functions': '^6.1.0',
  },
};
writeFileSync('lib/package.json', JSON.stringify(pkg, null, 2));

console.log('Bundled to lib/index.js (+ slim package.json)');
