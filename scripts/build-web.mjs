/**
 * Build the public site and the staff CRM into one deployable folder.
 *
 * The client wanted the website to be the front door, with a Staff Login
 * button leading into the CRM. Both are separate Vite apps, and both emit
 * `assets/…`, so they can't simply share a folder — the CRM is therefore built
 * with `GN_BASE=/app/` (partner-web already supports this, and derives its
 * router basename from it) and its output is copied into `apps/site/dist/app`.
 *
 * Result:  /        → the website
 *          /app     → the Transporter OS sign-in
 *
 * Firebase serves `apps/site/dist` with two rewrites so both single-page apps
 * get their own index.html — see firebase.json.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteDist = path.join(root, 'apps', 'site', 'dist');
const crmDist = path.join(root, 'apps', 'partner-web', 'dist');
const target = path.join(siteDist, 'app');

const run = (cmd, env) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
};

// 1. The website, at the root.
run('npm run build -w @shipva/site');

// 2. The CRM, under /app. GN_BASE drives both the asset URLs and the router
//    basename, so nothing in partner-web needs to know where it's mounted.
run('npm run build -w @shipva/partner-web', { GN_BASE: '/app/' });

// 3. Stack the CRM inside the site build.
if (!existsSync(siteDist)) throw new Error(`Website build missing: ${siteDist}`);
if (!existsSync(crmDist)) throw new Error(`CRM build missing: ${crmDist}`);
rmSync(target, { recursive: true, force: true });
cpSync(crmDist, target, { recursive: true });

console.log(`\nDone. Deploy apps/site/dist — website at /, staff CRM at /app.`);
